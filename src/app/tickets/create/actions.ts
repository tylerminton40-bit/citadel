"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export async function createTicket(formData: FormData) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const subject = formData.get("subject") as string
  const notes = formData.get("notes") as string
  const file = formData.get("proof") as File

  if (!subject || !file || file.size === 0) {
    redirect("/tickets/create?error=missing")
  }

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

  // Upload file to storage
  const fileExt = file.name.split(".").pop()
  const fileName = `${profile.id}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("ticket-proofs")
    .upload(fileName, file)

  if (uploadError) {
    console.error("Upload error:", uploadError)
    redirect("/tickets/create?error=upload")
  }

  const { data: { publicUrl } } = supabase.storage
    .from("ticket-proofs")
    .getPublicUrl(fileName)

  // Create ticket
 const matchId = formData.get("match_id") as string

const { data: ticket, error } = await supabase
  .from("tickets")
  .insert({
    creator_id: profile.id,
    match_id: matchId || null,
    subject,
    notes: notes || null,
    status: "open",
  })
    .select()
    .single()

  if (error || !ticket) {
    redirect("/tickets/create?error=ticket")
  }

  // Save proof
  await supabase.from("ticket_proofs").insert({
    ticket_id: ticket.id,
    file_url: publicUrl,
    file_type: file.type.startsWith("video") ? "video" : "image",
  })

  redirect("/tickets")
}