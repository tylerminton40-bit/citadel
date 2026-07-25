"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const ADMIN_STEAM_ID = "76561199480856629"

export async function resolveTicket(ticketId: string, formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  if (steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }

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