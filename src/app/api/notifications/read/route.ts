import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)

  return NextResponse.json({ success: true })
}