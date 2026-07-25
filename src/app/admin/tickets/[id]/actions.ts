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

  // If match was already completed, reverse the old XP + wins/losses
  if (match.status === "completed" && match.winner_id) {
    const oldWinnerId = match.winner_id
    const oldLoserId = oldWinnerId === match.creator_id ? match.opponent_id : match.creator_id

    if (oldWinnerId) {
      await supabase.rpc("increment_xp", { profile_id: oldWinnerId, amount: -30 })
      await supabase.rpc("decrement_wins", { profile_id: oldWinnerId })
    }
    if (oldLoserId) {
      await supabase.rpc("increment_xp", { profile_id: oldLoserId, amount: -10 })
      await supabase.rpc("decrement_losses", { profile_id: oldLoserId })
    }
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
	
	// Get the ticket to find the creator
const { data: ticket } = await supabase
  .from("tickets")
  .select("creator_id")
  .eq("id", ticketId)
  .single()

if (ticket?.creator_id) {
  await createNotification({
    userId: ticket.creator_id,
    type: "ticket_resolved",
    title: "Ticket Resolved",
    message: response || "Your ticket has been resolved",
    link: `/tickets/${ticketId}`
  })
}



  // Give new XP + wins/losses
  if (newWinnerId) {
    await supabase.rpc("increment_xp", { profile_id: newWinnerId, amount: 30 })
    await supabase.rpc("increment_wins", { profile_id: newWinnerId })
  }
  if (newLoserId) {
    await supabase.rpc("increment_xp", { profile_id: newLoserId, amount: 10 })
    await supabase.rpc("increment_losses", { profile_id: newLoserId })
  }

  // Resolve ticket
  await supabase
    .from("tickets")
    .update({
      status: "resolved",
      admin_response: `Admin set the winner. Match and stats updated.`,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
	
	// Get the ticket to find the creator
const { data: ticket } = await supabase
  .from("tickets")
  .select("creator_id")
  .eq("id", ticketId)
  .single()

if (ticket?.creator_id) {
  await createNotification({
    userId: ticket.creator_id,
    type: "ticket_resolved",
    title: "Ticket Resolved",
    message: response || "Your ticket has been resolved",
    link: `/tickets/${ticketId}`
  })
}



  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath("/admin/tickets")
  redirect("/admin/tickets")
}