"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function createMatch(formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const format = formData.get("format") as string
  const region = formData.get("region") as string
  const notes = formData.get("notes") as string

  const ruleset = format === "6v6" ? "Normal" : "Street Brawl"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get creator profile id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  await supabase.from("matches").insert({
    creator_id: profile.id,
    format,
    region,
    ruleset,
    status: "open",
    // notes can be added later if you expand the table
  })

  redirect("/matches")
}