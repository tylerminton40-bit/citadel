import { createClient } from "@supabase/supabase-js"

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: string
  title: string
  message?: string
  link?: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: message || null,
    link: link || null,
  })
}