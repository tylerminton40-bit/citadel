import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const { matchId, code } = await request.json()
  if (!matchId || !code) return NextResponse.json({ error: "Missing data" }, { status: 400 })

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  // Only the creator (host) can set the code
  const { data: match } = await supabase
    .from("matches")
    .select("creator_id")
    .eq("id", matchId)
    .single()

  if (!match || match.creator_id !== profile.id) {
    return NextResponse.json({ error: "Only host can set code" }, { status: 403 })
  }

  await supabase
    .from("matches")
    .update({ private_code: code })
    .eq("id", matchId)

  return NextResponse.json({ success: true })
}