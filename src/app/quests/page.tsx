import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { claimQuest } from "./actions"
import Link from "next/link"

const QUESTS = [
  { key: "win_1", title: "Win 1 Match", target: 1, reward: 25 },
  { key: "play_2", title: "Play 2 Matches", target: 2, reward: 20 },
  { key: "win_2", title: "Win 2 Matches", target: 2, reward: 50 },
]

export default async function QuestsPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/quests")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/quests")

  const today = new Date().toISOString().slice(0, 10)

  // Only create missing quests — never reset progress
  for (const q of QUESTS) {
    const { data: existing } = await supabase
      .from("daily_quests")
      .select("id")
      .eq("user_id", profile.id)
      .eq("quest_key", q.key)
      .eq("quest_date", today)
      .maybeSingle()

    if (!existing) {
      await supabase.from("daily_quests").insert({
        user_id: profile.id,
        quest_key: q.key,
        target: q.target,
        quest_date: today,
        progress: 0,
        completed: false,
        claimed: false,
      })
    }
  }

  const { data: quests } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", profile.id)
    .eq("quest_date", today)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to Hub
        </Link>
        <h1 className="text-3xl font-bold mb-2">Daily Quests</h1>
        <p className="text-gray-400 text-sm mb-10">
          Complete quests for bonus XP. Resets every day.
        </p>

        <div className="space-y-4">
          {QUESTS.map((q) => {
            const userQuest = quests?.find((uq) => uq.quest_key === q.key)
            const progress = userQuest?.progress || 0
            const completed = progress >= q.target
            const claimed = userQuest?.claimed || false

            return (
              <div
                key={q.key}
                className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-sm text-gray-400">+{q.reward} XP</div>
                  </div>

                  {claimed ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                      Claimed
                    </span>
                  ) : completed ? (
                    <form action={claimQuest.bind(null, q.key, q.reward)}>
                      <button type="submit" className="btn-primary px-4 py-1.5 rounded-xl text-sm">
                        Claim
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {progress}/{q.target}
                    </span>
                  )}
                </div>

                <div className="h-2 bg-[#1c1c28] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (progress / q.target) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}