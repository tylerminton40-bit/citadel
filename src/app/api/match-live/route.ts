import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await supabase
    .from("matches")
    .select("private_code")
    .eq("id", matchId)
    .single()

  const { data: messages } = await supabase
    .from("match_messages")
    .select("*, sender:profiles(steam_name, steam_id)")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })

  return NextResponse.json({
    code: match?.private_code || null,
    messages: messages || [],
  })
}