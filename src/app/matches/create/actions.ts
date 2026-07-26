"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function createMatch(formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const format = formData.get("format") as string
  const bestOf = formData.get("best_of") as string
  const region = formData.get("region") as string
  const teamId = (formData.get("team_id") as string) || null
const ruleset = (formData.get("ruleset") as string) || "Street Brawl"
const map = ruleset.startsWith("Normal") ? "Normal" : "Street Brawl"

  const needsTeam = ["2v2", "3v3", "4v4", "6v6"].includes(format)
  const sizeMap: Record<string, number> = { "2v2": 2, "3v3": 3, "4v4": 4, "6v6": 6 }

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

  // Active match check
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .in("status", ["open", "accepted"])
    .limit(1)

  if (existing && existing.length > 0) {
    redirect("/matches?error=already_in_match")
  }

  let creatorTeamId = null

  if (needsTeam) {
    if (!teamId) {
      redirect("/matches/create?error=team_required")
    }

    // Verify ownership/membership + correct size
    const { data: membership } = await supabase
      .from("team_members")
      .select("*, team:teams(*)")
      .eq("profile_id", profile.id)
      .eq("team_id", teamId)
      .single()

    if (!membership || membership.team.size !== sizeMap[format]) {
      redirect("/matches/create?error=wrong_team_size")
    }

    creatorTeamId = teamId
  }

  await supabase.from("matches").insert({
    creator_id: profile.id,
    creator_team_id: creatorTeamId,
    format,
    best_of: bestOf,
    region,
    ruleset,
    map,
    status: "open",
  })

  redirect("/matches")
}