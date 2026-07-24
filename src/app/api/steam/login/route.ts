import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "playcitadel.pro"
  const protocol = host.includes("localhost") ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  const returnUrl = `${baseUrl}/api/steam/callback`
  const realm = baseUrl

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  })

  const steamUrl = `https://steamcommunity.com/openid/login?${params.toString()}`

  return NextResponse.redirect(steamUrl)
}