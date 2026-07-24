import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const claimedId = searchParams.get("openid.claimed_id")

  if (!claimedId) {
    return NextResponse.redirect(new URL("/?error=steam", request.url))
  }

  const steamId = claimedId.split("/").pop()
  if (!steamId) {
    return NextResponse.redirect(new URL("/?error=steam", request.url))
  }

  // Get Steam name + avatar
  const steamApiKey = process.env.STEAM_API_KEY
  const steamRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`
  )
  const steamData = await steamRes.json()
  const player = steamData?.response?.players?.[0]

  const steamName = player?.personaname || "Unknown"
  const avatarUrl = player?.avatarfull || null

  // Save to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from("profiles").upsert(
    {
      steam_id: steamId,
      steam_name: steamName,
      avatar_url: avatarUrl,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "steam_id" }
  )

  // Set a cookie so the user stays logged in
  const cookieStore = await cookies()
  cookieStore.set("citadel_steam_id", steamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  // Clean redirect (no ugly query params)
  return NextResponse.redirect(new URL("/", request.url))
}