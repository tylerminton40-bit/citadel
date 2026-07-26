import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || ""

  if (q.length < 2) {
    return NextResponse.json({ players: [] })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("profiles")
    .select("id, steam_name, avatar_url, xp, wins, losses")
    .ilike("steam_name", `%${q}%`)
    .order("xp", { ascending: false })
    .limit(20)

  return NextResponse.json({ players: data || [] })
}