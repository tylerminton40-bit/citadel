import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete("citadel_steam_id")
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "https://playcitadel.pro"))
}