"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function getProfile() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/scrims")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/scrims")
  return { supabase, profile }
}

export async function createScrim(formData: FormData) {
  const { supabase, profile } = await getProfile()

  const teamId = formData.get("team_id") as string
  const visibility = (formData.get("visibility") as string) || "open"
  const scheduledRaw = (formData.get("scheduled_at") as string) || ""

  if (!teamId) redirect("/scrims/create?error=team")

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, team:teams(*)")
    .eq("profile_id", profile.id)
    .eq("team_id", teamId)
    .single()

  const team = membership?.team
    ? Array.isArray(membership.team)
      ? membership.team[0]
      : membership.team
    : null

  if (!team || !team.is_scrim) {
    redirect("/scrims/create?error=not_scrim")
  }

  // Only one open/accepted scrim per team
  const { data: busy } = await supabase
    .from("scrims")
    .select("id")
    .or(`creator_team_id.eq.${teamId},opponent_team_id.eq.${teamId}`)
    .in("status", ["open", "accepted", "drafting", "live"])
    .limit(1)

  if (busy && busy.length > 0) {
    redirect("/scrims?error=team_busy")
  }

  const scheduled_at = scheduledRaw ? new Date(scheduledRaw).toISOString() : null

  const { data: scrim, error } = await supabase
    .from("scrims")
    .insert({
      creator_id: profile.id,
      creator_team_id: teamId,
      visibility: visibility === "private" ? "private" : "open",
      status: "open",
      scheduled_at,
    })
    .select()
    .single()

  if (error || !scrim) {
    redirect("/scrims/create?error=failed")
  }

  revalidatePath("/scrims")
  redirect(`/scrims/${scrim.id}`)
}

export async function cancelScrim(scrimId: string) {
  const { supabase, profile } = await getProfile()

  await supabase
    .from("scrims")
    .update({ status: "cancelled" })
    .eq("id", scrimId)
    .eq("creator_id", profile.id)
    .eq("status", "open")

  revalidatePath("/scrims")
  redirect("/scrims")
}

export async function acceptScrim(scrimId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const teamId = formData.get("team_id") as string

  if (!teamId) redirect(`/scrims/${scrimId}?error=team`)

  const { data: scrim } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .eq("status", "open")
    .single()

  if (!scrim) redirect("/scrims")

  if (scrim.creator_team_id === teamId) {
    redirect(`/scrims/${scrimId}?error=own_team`)
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)
    .eq("team_id", teamId)
    .single()

  const team = membership?.team
    ? Array.isArray(membership.team)
      ? membership.team[0]
      : membership.team
    : null

  if (!team || !team.is_scrim) {
    redirect(`/scrims/${scrimId}?error=not_scrim`)
  }

  const { data: busy } = await supabase
    .from("scrims")
    .select("id")
    .or(`creator_team_id.eq.${teamId},opponent_team_id.eq.${teamId}`)
    .in("status", ["open", "accepted", "drafting", "live"])
    .limit(1)

  if (busy && busy.length > 0) {
    redirect(`/scrims/${scrimId}?error=team_busy`)
  }

  const talkEnds = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase
    .from("scrims")
    .update({
      opponent_team_id: teamId,
      opponent_captain_id: profile.id,
      status: "accepted",
      talk_ends_at: talkEnds,
      creator_ready: false,
      opponent_ready: false,
    })
    .eq("id", scrimId)

  revalidatePath(`/scrims/${scrimId}`)
  redirect(`/scrims/${scrimId}`)
}