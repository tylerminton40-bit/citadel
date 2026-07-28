"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const ADMIN_STEAM_ID = "76561199480856629"

export async function forceWinner(matchId: string, winnerSide: "creator" | "opponent") {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  if (!steamId || steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match) return

  const winnerId = winnerSide === "creator" ? match.creator_id : match.opponent_id
  const loserId = winnerSide === "creator" ? match.opponent_id : match.creator_id

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

  // Give XP
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
}