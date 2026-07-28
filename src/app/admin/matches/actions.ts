"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const ADMIN_STEAM_ID = "76561199480856629"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId || steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }
}

export async function forceWinner(matchId: string, winnerSide: "creator" | "opponent") {
  await requireAdmin()
  const supabase = getSupabase()

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match || !match.opponent_id) return

  const winnerId = winnerSide === "creator" ? match.creator_id : match.opponent_id
  const loserId = winnerSide === "creator" ? match.opponent_id : match.creator_id

  // Reverse old stats if already completed
  if (match.status === "completed" && match.winner_id) {
    const oldWinner = match.winner_id
    const oldLoser =
      match.winner_id === match.creator_id ? match.opponent_id : match.creator_id

    if (oldWinner) {
      await supabase.rpc("decrement_wins", { profile_id: oldWinner })
      await supabase.rpc("increment_xp", { profile_id: oldWinner, amount: -30 })
    }
    if (oldLoser) {
      await supabase.rpc("decrement_losses", { profile_id: oldLoser })
      await supabase.rpc("increment_xp", { profile_id: oldLoser, amount: 20 })
    }
  }

  await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_id: winnerId,
      creator_report: winnerSide,
      opponent_report: winnerSide,
      result_source: "admin",
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  if (winnerId) {
    await supabase.rpc("increment_xp", { profile_id: winnerId, amount: 30 })
    await supabase.rpc("increment_wins", { profile_id: winnerId })
  }
  if (loserId) {
    await supabase.rpc("increment_xp", { profile_id: loserId, amount: -20 })
    await supabase.rpc("increment_losses", { profile_id: loserId })
  }

  revalidatePath("/admin/matches")
  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/matches")
  revalidatePath("/profile")
}

export async function forceCancelMatch(matchId: string) {
  await requireAdmin()
  const supabase = getSupabase()

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match) return

  // Reverse XP / W-L if it was completed
  if (match.status === "completed" && match.winner_id) {
    const winnerId = match.winner_id
    const loserId =
      match.winner_id === match.creator_id ? match.opponent_id : match.creator_id

    if (winnerId) {
      await supabase.rpc("decrement_wins", { profile_id: winnerId })
      await supabase.rpc("increment_xp", { profile_id: winnerId, amount: -30 })
    }
    if (loserId) {
      await supabase.rpc("decrement_losses", { profile_id: loserId })
      await supabase.rpc("increment_xp", { profile_id: loserId, amount: 20 })
    }
  }

  await supabase.from("match_messages").delete().eq("match_id", matchId)
  await supabase.from("xp_events").delete().eq("match_id", matchId)
  await supabase.from("matches").delete().eq("id", matchId)

  revalidatePath("/admin/matches")
  revalidatePath("/matches")
  revalidatePath("/profile")
}