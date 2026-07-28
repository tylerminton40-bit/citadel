"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function claimQuest(questKey: string, xpReward: number) {
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

  const today = new Date().toISOString().slice(0, 10)

  const { data: quest } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", profile.id)
    .eq("quest_key", questKey)
    .eq("quest_date", today)
    .single()

  if (!quest || quest.claimed || quest.progress < quest.target) {
    redirect("/quests")
  }

  await supabase
    .from("daily_quests")
    .update({ claimed: true, completed: true })
    .eq("id", quest.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("increment_xp", {
    profile_id: profile.id,
    amount: xpReward,
  })

  revalidatePath("/quests")
  revalidatePath("/profile")
  redirect("/quests")
}