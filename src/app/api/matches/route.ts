import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const MATCH_SELECT = `
  *,
  creator:profiles!matches_creator_id_fkey(steam_name, avatar_url),
  opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url),
  creator_team:teams!matches_creator_team_id_fkey(name, tag),
  opponent_team:teams!matches_opponent_team_id_fkey(name, tag)
`

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab") || "open"
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let profileId: string | null = null
  if (steamId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("steam_id", steamId)
      .single()
    profileId = profile?.id || null
  }

  if (tab === "open") {
    const { data: matches } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30)

    return NextResponse.json({
      matches: matches || [],
      currentUserId: profileId,
    })
  }

  // "yours" tab — captain matches + team matches
  if (tab === "yours" && profileId) {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", profileId)

    const teamIds = (memberships || []).map((m) => m.team_id)

    const { data: captainMatches } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .or(`creator_id.eq.${profileId},opponent_id.eq.${profileId}`)
      .order("created_at", { ascending: false })
      .limit(50)

    let teamMatches: typeof captainMatches = []

    if (teamIds.length > 0) {
      const { data } = await supabase
        .from("matches")
        .select(MATCH_SELECT)
        .or(
          teamIds
            .map((id) => `creator_team_id.eq.${id},opponent_team_id.eq.${id}`)
            .join(",")
        )
        .order("created_at", { ascending: false })
        .limit(50)

      teamMatches = data || []
    }

    const map = new Map<string, NonNullable<typeof captainMatches>[number]>()
    for (const m of [...(captainMatches || []), ...(teamMatches || [])]) {
      map.set(m.id, m)
    }

    const matches = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      matches,
      currentUserId: profileId,
    })
  }

  return NextResponse.json({
    matches: [],
    currentUserId: profileId,
  })
}