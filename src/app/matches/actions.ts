"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function cancelMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  // Only allow the creator to cancel
  await supabase
    .from("matches")
    .update({ status: "cancelled" })
    .eq("id", matchId)
    .eq("creator_id", profile.id)
    .eq("status", "open")

  redirect("/matches")
}