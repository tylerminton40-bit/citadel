"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

const SIZE_MAP: Record<string, number> = {
  "1v1": 1,
  "2v2": 2,
  "3v3": 3,
  "4v4": 4,
  "6v6": 6,
}

export async function createMatch(formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/matches/create")

  const format = formData.get("format") as string
  const bestOf = (formData.get("best_of") as string) || "Bo1"
  const region = (formData.get("region") as string) || "NA East"
  const ruleset = (formData.get("ruleset") as string) || "Street Brawl"
  const teamId = (formData.get("team_id") as string) || null

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

  // Already in an active match as captain?
  const { data: existing } = await supabase
    .from("matches")
    .select("id, creator_report, opponent_report, status, creator_id, opponent_id")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .in("status", ["open", "accepted"])
    .limit(10)

  const stillBusy = (existing || []).some((m) => {
    if (m.status === "open") return true
    if (m.creator_id === profile.id && !m.creator_report) return true
    if (m.opponent_id === profile.id && !m.opponent_report) return true
    return false
  })
  if (stillBusy) redirect("/matches?error=already_in_match")

  const needed = SIZE_MAP[format] || 1

  // Team formats require a normal (non-scrim) team you captain, full roster
  if (needed > 1) {
    if (!teamId) redirect("/matches/create?error=need_team")

    const { data: team } = await supabase
      .from("teams")
      .select("id, owner_id, is_scrim, size")
      .eq("id", teamId)
      .single()

    if (!team) redirect("/matches/create?error=team")
    if (team.is_scrim) redirect("/matches/create?error=scrim_team")
    if (team.owner_id !== profile.id) redirect("/matches/create?error=not_captain")

    const { data: members } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)

    const count = members?.length || 0
    if (count < needed) {
      redirect(`/matches/create?error=roster_${needed}`)
    }
  }

  const map = ruleset.startsWith("Street")
    ? "Street Brawl"
    : format === "6v6"
    ? "Normal Map"
    : "Normal Map"

  await supabase.from("matches").insert({
    creator_id: profile.id,
    format,
    best_of: bestOf,
    region,
    ruleset,
    map,
    status: "open",
    creator_team_id: needed > 1 ? teamId : null,
    host_id: profile.id,
  })

  redirect("/matches")
}