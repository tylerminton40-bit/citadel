"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function createMatch(formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const format = formData.get("format") as string
  const bestOf = formData.get("best_of") as string
  const region = formData.get("region") as string

  const ruleset = format === "6v6" ? "Normal" : "Street Brawl"
  const map = format === "6v6" ? "Normal Map" : "Street Brawl"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

// Check if player already has an active match
const { data: existing } = await supabase
  .from("matches")
  .select("id")
  .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
  .in("status", ["open", "accepted"])
  .limit(1)

if (existing && existing.length > 0) {
  redirect("/matches?error=already_in_match")
}

  await supabase.from("matches").insert({
    creator_id: profile.id,
    format,
    best_of: bestOf,
    region,
    ruleset,
    map,
    status: "open",
  })

  redirect("/matches")
}