"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

const ADMIN_STEAM_ID = "76561199480856629"

export async function resolveTicket(ticketId: string, formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (steamId !== ADMIN_STEAM_ID) redirect("/")

  const response = formData.get("response") as string

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from("tickets")
    .update({
      status: "resolved",
      admin_response: response || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId)

  const { data: ticketInfo } = await supabase
    .from("tickets")
    .select("creator_id")
    .eq("id", ticketId)
    .single()

  if (ticketInfo?.creator_id) {
    await createNotification({
      userId: ticketInfo.creator_id,
      type: "ticket_resolved",
      title: "Ticket Resolved",
      message: response || "Your ticket has been resolved",
      link: `/tickets/${ticketId}`,
    })
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath("/admin/tickets")
  redirect("/admin/tickets")
}

export async function forceWinner(matchId: string, ticketId: string, formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (steamId !== ADMIN_STEAM_ID) redirect("/")

  const winner = formData.get("winner") as string
  if (!winner) return

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

  const newWinnerId = winner === "creator" ? match.creator_id : match.opponent_id
  const newLoserId = winner === "creator" ? match.opponent_id : match.creator_id

  // Reverse old stats if already completed
  if (match.status === "completed" && match.winner_id) {
    const oldWinnerId = match.winner_id
    const oldLoserId = oldWinnerId === match.creator_id ? match.opponent_id : match.creator_id

    if (oldWinnerId) {
      await supabase.rpc("increment_xp", { profile_id: oldWinnerId, amount: -30 })
      await supabase.rpc("decrement_wins", { profile_id: oldWinnerId })
    }
    if (oldLoserId) {
      await supabase.rpc("increment_xp", { profile_id: oldLoserId, amount: 20 })
      await supabase.rpc("decrement_losses", { profile_id: oldLoserId })
    }
  }
  // Update daily quests for both players
const today = new Date().toISOString().slice(0, 10)

async function bumpQuest(userId: string, key: string, amount = 1) {
  const { data: quest } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", key)
    .eq("quest_date", today)
    .single()

  if (quest && !quest.claimed) {
    const newProgress = Math.min(quest.progress + amount, quest.target)
    await supabase
      .from("daily_quests")
      .update({
        progress: newProgress,
        completed: newProgress >= quest.target,
      })
      .eq("id", quest.id)
  }
}

// Both players played a match
if (winnerId) await bumpQuest(winnerId, "play_2")
if (loserId) await bumpQuest(loserId, "play_2")

// Winner progress
if (winnerId) {
  await bumpQuest(winnerId, "win_1")
  await bumpQuest(winnerId, "win_2")
}

  // Set new winner
  await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_id: newWinnerId,
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  if (newWinnerId) {
    await supabase.rpc("increment_xp", { profile_id: newWinnerId, amount: 30 })
    await supabase.rpc("increment_wins", { profile_id: newWinnerId })
  }
  if (newLoserId) {
    await supabase.rpc("increment_xp", { profile_id: newLoserId, amount: -20 })
    await supabase.rpc("increment_losses", { profile_id: newLoserId })
  }

  // Resolve ticket + notify
  await supabase
    .from("tickets")
    .update({
      status: "resolved",
      admin_response: "Admin set the winner. Match and stats updated.",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId)

  const { data: ticketInfo } = await supabase
    .from("tickets")
    .select("creator_id")
    .eq("id", ticketId)
    .single()

  if (ticketInfo?.creator_id) {
    await createNotification({
      userId: ticketInfo.creator_id,
      type: "ticket_resolved",
      title: "Ticket Resolved",
      message: "Admin set the winner. Match and stats updated.",
      link: `/tickets/${ticketId}`,
    })
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath("/admin/tickets")
  redirect("/admin/tickets")
}