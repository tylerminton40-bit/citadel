"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

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
    .select("id, steam_name")
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

  // Get the match first so we know the creator
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("status", "open")
    .single()

  if (!match) redirect("/matches")

  await supabase
    .from("matches")
    .update({
      opponent_id: profile.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      host_id: match.creator_id
    })
    .eq("id", matchId)

  // Notify the creator
  await createNotification({
    userId: match.creator_id,
    type: "match_accepted",
    title: "Match Accepted",
    message: `${profile.steam_name} accepted your match`,
    link: `/matches/${matchId}`
  })

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

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match || match.status !== "accepted") return

  const isCreator = profile.id === match.creator_id
  const isOpponent = profile.id === match.opponent_id
  if (!isCreator && !isOpponent) return

  // Save this player's report
  const updateData: { creator_report?: string; opponent_report?: string } = {}
  if (isCreator) updateData.creator_report = winner
  if (isOpponent) updateData.opponent_report = winner

  await supabase
    .from("matches")
    .update(updateData)
    .eq("id", matchId)


  // Re-fetch to see both reports
  const { data: updated } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!updated) return

// Notify the other player that a report was submitted
const otherPlayerId = isCreator ? updated.opponent_id : updated.creator_id
if (otherPlayerId) {
  await createNotification({
    userId: otherPlayerId,
    type: "result_reported",
    title: "Result Reported",
    message: "Your opponent submitted a result report",
    link: `/matches/${matchId}`
  })
}

// If the match just completed (both agreed)
if (updated.creator_report && updated.opponent_report && updated.creator_report === updated.opponent_report) {
  // notify both that match is complete (optional extra)
}

// Both have reported
if (updated.creator_report && updated.opponent_report) {
  if (updated.creator_report === updated.opponent_report) {
    // They agree → complete the match
    const winnerId = updated.creator_report === "creator" ? updated.creator_id : updated.opponent_id
    const loserId = updated.creator_report === "creator" ? updated.opponent_id : updated.creator_id

    await supabase
      .from("matches")
      .update({
        status: "completed",
        winner_id: winnerId,
        completed_at: new Date().toISOString()
      })
      .eq("id", matchId)

    // Give XP
    if (winnerId) {
      await supabase.rpc("increment_xp", { profile_id: winnerId, amount: 30 })
      await supabase.rpc("increment_wins", { profile_id: winnerId })
    }
    if (loserId) {
      await supabase.rpc("increment_xp", { profile_id: loserId, amount: -20 })
      await supabase.rpc("increment_losses", { profile_id: loserId })
    }
  } else {
    // They disagree → disputed
    await supabase
      .from("matches")
      .update({ status: "disputed" })
      .eq("id", matchId)
  }
} else {
  // Only one person has reported → keep it as accepted (pending second report)
  // Do nothing extra
}

  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/profile")
}
