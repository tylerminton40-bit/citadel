"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function cancelMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

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

  await supabase
    .from("matches")
    .update({ status: "cancelled" })
    .eq("id", matchId)
    .eq("creator_id", profile.id)
    .eq("status", "open")

  redirect("/matches")
}

export async function acceptMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

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

  // Set opponent and mark as accepted
  await supabase
    .from("matches")
    .update({
      opponent_id: profile.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      host_id: profile.id // temporary - we can improve host selection later
    })
    .eq("id", matchId)
    .eq("status", "open")

  revalidatePath(`/matches/${matchId}`)
  redirect(`/matches/${matchId}`)
}

export async function setPrivateCode(matchId: string, formData: FormData) {
  const code = formData.get("code") as string
  if (!code) return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  await supabase
    .from("matches")
    .update({ private_code: code })
    .eq("id", matchId)
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)

  revalidatePath(`/matches/${matchId}`)
}

export async function sendMessage(matchId: string, formData: FormData) {
  const message = formData.get("message") as string
  if (!message || message.trim() === "") return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  await supabase.from("match_messages").insert({
    match_id: matchId,
    sender_id: profile.id,
    message: message.trim()
  })

  revalidatePath(`/matches/${matchId}`)
}

export async function reportResult(matchId: string, formData: FormData) {
  const winner = formData.get("winner") as string // "creator" or "opponent"
  if (!winner) return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  // Get the match
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match || match.status !== "accepted") return

  // Only participants can report
  if (profile.id !== match.creator_id && profile.id !== match.opponent_id) return

  const winnerId = winner === "creator" ? match.creator_id : match.opponent_id
  const loserId = winner === "creator" ? match.opponent_id : match.creator_id

  // Update match
  await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_id: winnerId,
      completed_at: new Date().toISOString()
    })
    .eq("id", matchId)

  // Give XP
  // Winner +30, Loser +10
  if (winnerId) {
    await supabase.rpc("increment_xp", { profile_id: winnerId, amount: 30 })
    await supabase.rpc("increment_wins", { profile_id: winnerId })
  }
  if (loserId) {
    await supabase.rpc("increment_xp", { profile_id: loserId, amount: 10 })
    await supabase.rpc("increment_losses", { profile_id: loserId })
  }

  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/profile")
}

