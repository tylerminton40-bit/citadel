import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

  const { error } = await supabase.from("profiles").upsert(
    {
      steam_id: steamId,
      steam_name: steamName,
      avatar_url: avatarUrl,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "steam_id" }
  )

  if (error) {
    console.error("Supabase error:", error)
  }

  // For now redirect back with the name so we can see it worked
  return NextResponse.redirect(
    new URL(`/?loggedin=1&name=${encodeURIComponent(steamName)}`, request.url)
  )
}