"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function getProfile() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")
  return { supabase, profile }
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
  if (memberProfileId === profile.id) redirect("/teams") // can't kick yourself

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", memberProfileId)

  revalidatePath("/teams")
  redirect("/teams")
}

export async function createTeam(formData: FormData) {
  const { supabase, profile } = await getProfile()

  const name = (formData.get("name") as string)?.trim()
  const tag = (formData.get("tag") as string)?.trim() || null
  const size = parseInt(formData.get("size") as string, 10)

  if (!name || ![2, 3, 4, 6].includes(size)) {
    redirect("/teams/create?error=invalid")
  }

  // Already on a team of this size?
  const { data: existing } = await supabase
    .from("team_members")
    .select("id, team:teams(size)")
    .eq("profile_id", profile.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (existing?.some((m: any) => m.team?.size === size)) {
    redirect("/teams/create?error=already_on_size")
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name, tag, size, owner_id: profile.id, wins: 0, losses: 0 })
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

export async function invitePlayer(teamId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const steamName = (formData.get("steam_name") as string)?.trim()

  if (!steamName) redirect(`/teams/${teamId}/invite?error=name`)

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")

  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_name", steamName)
    .single()

  if (!invitee) {
    redirect(`/teams/${teamId}/invite?error=not_found`)
  }

  // Already on a team of this size?
  const { data: theirTeams } = await supabase
    .from("team_members")
    .select("id, team:teams(size)")
    .eq("profile_id", invitee.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (theirTeams?.some((m: any) => m.team?.size === team.size)) {
    redirect(`/teams/${teamId}/invite?error=already_on_size`)
  }

  await supabase.from("team_invites").upsert({
    team_id: teamId,
    inviter_id: profile.id,
    invitee_id: invitee.id,
    status: "pending",
  }, { onConflict: "team_id,invitee_id" })

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

  // Already on a team of this size?
  const { data: existing } = await supabase
    .from("team_members")
    .select("id, team:teams(size)")
    .eq("profile_id", profile.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (existing?.some((m: any) => m.team?.size === invite.team.size)) {
    redirect("/teams?error=already_on_size")
  }

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", invite.team_id)

  if (count !== null && count >= invite.team.size) {
    redirect("/teams?error=team_full")
  }

  await supabase.from("team_members").insert({
    team_id: invite.team_id,
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

  const { data: membership } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("profile_id", profile.id)
    .single()

  if (!membership) redirect("/teams")

  if (membership.role === "owner") {
    await supabase.from("teams").delete().eq("id", teamId)
  } else {
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", profile.id)
  }

  revalidatePath("/teams")
  redirect("/teams")
}