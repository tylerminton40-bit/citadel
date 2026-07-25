import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab") || "open"

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let profileId = null
  if (steamId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("steam_id", steamId)
      .single()
    profileId = profile?.id || null
  }

  let query = supabase
    .from("matches")
    .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url), opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(30)

  if (tab === "open") {
    query = query.eq("status", "open")
  } else if (tab === "yours" && profileId) {
    query = query.or(`creator_id.eq.${profileId},opponent_id.eq.${profileId}`)
  }

  const { data: matches } = await query

  return NextResponse.json({
    matches: matches || [],
    currentUserId: profileId,
  })
}