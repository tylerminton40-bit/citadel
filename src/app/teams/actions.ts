"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function getProfile() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/teams")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/teams")
  return { supabase, profile }
}

export async function createTeam(formData: FormData) {
  const { supabase, profile } = await getProfile()

  const name = (formData.get("name") as string)?.trim()
  const tag = (formData.get("tag") as string)?.trim() || null
  const avatarUrl = (formData.get("avatar_url") as string)?.trim() || null
  const size = parseInt(formData.get("size") as string, 10)
  const isScrim = formData.get("is_scrim") === "true"

  if (!name || ![2, 3, 4, 6].includes(size)) {
    redirect("/teams/create?error=invalid")
  }

  type ExistingMember = {
    id: string
    team: { size: number; is_scrim: boolean } | { size: number; is_scrim: boolean }[] | null
  }

  const { data: existing } = await supabase
    .from("team_members")
    .select("id, team:teams(size, is_scrim)")
    .eq("profile_id", profile.id)

  const conflict = ((existing || []) as ExistingMember[]).some((m) => {
    const t = Array.isArray(m.team) ? m.team[0] : m.team
    return t && t.size === size && !!t.is_scrim === isScrim
  })

  if (conflict) {
    redirect("/teams/create?error=already_on_size")
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name,
      tag,
      size,
      owner_id: profile.id,
      wins: 0,
      losses: 0,
      avatar_url: avatarUrl,
      is_scrim: isScrim,
    })
    .select()
    .single()

  if (error || !team) {
    redirect("/teams/create?error=failed")
  }

  await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: profile.id,
    role: "owner",
  })

  revalidatePath("/teams")
  redirect("/teams")
}

export async function invitePlayerById(teamId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const playerId = formData.get("player_id") as string

  if (!playerId) redirect(`/teams/${teamId}/invite?error=name`)

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")

  type MemberRow = {
    id: string
    team: { size: number; is_scrim: boolean } | { size: number; is_scrim: boolean }[] | null
  }

  const { data: theirTeams } = await supabase
    .from("team_members")
    .select("id, team:teams(size, is_scrim)")
    .eq("profile_id", playerId)

  const alreadyOn = ((theirTeams || []) as MemberRow[]).some((m) => {
    const t = Array.isArray(m.team) ? m.team[0] : m.team
    return t && t.size === team.size && !!t.is_scrim === !!team.is_scrim
  })

  if (alreadyOn) {
    redirect(`/teams/${teamId}/invite?error=already_on_size`)
  }

  await supabase.from("team_invites").upsert(
    {
      team_id: teamId,
      inviter_id: profile.id,
      invitee_id: playerId,
      status: "pending",
    },
    { onConflict: "team_id,invitee_id" }
  )

  revalidatePath("/teams")
  redirect("/teams")
}

export async function acceptInvite(inviteId: string) {
  const { supabase, profile } = await getProfile()

  const { data: invite } = await supabase
    .from("team_invites")
    .select("*, team:teams(*)")
    .eq("id", inviteId)
    .eq("invitee_id", profile.id)
    .eq("status", "pending")
    .single()

  if (!invite) redirect("/teams")

  const team = Array.isArray(invite.team) ? invite.team[0] : invite.team
  if (!team) redirect("/teams")

  type MemberRow = {
    id: string
    team: { size: number; is_scrim: boolean } | { size: number; is_scrim: boolean }[] | null
  }

  const { data: existing } = await supabase
    .from("team_members")
    .select("id, team:teams(size, is_scrim)")
    .eq("profile_id", profile.id)

  const conflict = ((existing || []) as MemberRow[]).some((m) => {
    const t = Array.isArray(m.team) ? m.team[0] : m.team
    return t && t.size === team.size && !!t.is_scrim === !!team.is_scrim
  })

  if (conflict) {
    redirect("/teams?error=already_on_size")
  }

  await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: profile.id,
    role: "member",
  })

  await supabase
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)

  revalidatePath("/teams")
  redirect("/teams")
}

export async function declineInvite(inviteId: string) {
  const { supabase, profile } = await getProfile()

  await supabase
    .from("team_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("invitee_id", profile.id)

  revalidatePath("/teams")
  redirect("/teams")
}

export async function leaveTeam(teamId: string) {
  const { supabase, profile } = await getProfile()

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single()

  if (team?.owner_id === profile.id) {
    redirect("/teams?error=owner_cannot_leave")
  }

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profile.id)

  revalidatePath("/teams")
  redirect("/teams")
}

export async function kickMember(teamId: string, memberProfileId: string) {
  const { supabase, profile } = await getProfile()

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")
  if (memberProfileId === profile.id) redirect("/teams")

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", memberProfileId)

  revalidatePath("/teams")
  redirect("/teams")
}

export async function disbandTeam(teamId: string) {
  const { supabase, profile } = await getProfile()

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")

  await supabase.from("team_invites").delete().eq("team_id", teamId)
  await supabase.from("team_members").delete().eq("team_id", teamId)
  await supabase.from("teams").delete().eq("id", teamId)

  revalidatePath("/teams")
  revalidatePath("/scrims")
  redirect("/teams")
}