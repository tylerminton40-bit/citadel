"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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

  const winnerId = winner === "creator" ? match.creator_id : match.opponent_id
  const loserId = winner === "creator" ? match.opponent_id : match.creator_id

  // Complete the match
  await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_id: winnerId,
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  // Give XP
  if (winnerId) {
    await supabase.rpc("increment_xp", { profile_id: winnerId, amount: 30 })
    await supabase.rpc("increment_wins", { profile_id: winnerId })
  }
  if (loserId) {
    await supabase.rpc("increment_xp", { profile_id: loserId, amount: 10 })
    await supabase.rpc("increment_losses", { profile_id: loserId })
  }

  // Resolve the ticket
  await supabase
    .from("tickets")
    .update({
      status: "resolved",
      admin_response: `Admin forced winner. Match completed.`,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId)

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath("/admin/tickets")
  redirect("/admin/tickets")
}