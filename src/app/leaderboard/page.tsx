import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getRank } from "@/lib/ranks"

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const currentTab = tab || "lifetime"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .limit(200)

  const players = (data || [])
    .map((p) => ({
      ...p,
      net: (p.wins || 0) - (p.losses || 0),
    }))
    .sort((a, b) => {
      if (currentTab === "monthly") {
        // net wins, then total wins as tiebreaker
        if (b.net !== a.net) return b.net - a.net
        return (b.wins || 0) - (a.wins || 0)
      }
      // lifetime: XP first, then net
      if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0)
      return b.net - a.net
    })
    .slice(0, 50)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to Hub
        </Link>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400 text-sm mb-8">
          {currentTab === "monthly" ? "Sorted by wins − losses" : "Sorted by XP"}
        </p>

        <div className="flex gap-2 mb-8">
          <Link
            href="/leaderboard?tab=lifetime"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentTab === "lifetime"
                ? "bg-[#FF5C00] text-black"
                : "bg-[#111118] text-gray-400 hover:text-white"
            }`}
          >
            Lifetime
          </Link>
          <Link
            href="/leaderboard?tab=monthly"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentTab === "monthly"
                ? "bg-[#FF5C00] text-black"
                : "bg-[#111118] text-gray-400 hover:text-white"
            }`}
          >
            Record
          </Link>
        </div>

        <div className="space-y-2">
          {players.length > 0 ? (
            players.map((player, index) => {
              const rank = getRank(player.xp || 0)
              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center gap-4 bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 hover:border-[#FF5C00]/40 transition"
                >
                  <div className={`w-8 text-center font-bold text-lg ${
                    index === 0 ? "text-yellow-400" :
                    index === 1 ? "text-gray-300" :
                    index === 2 ? "text-orange-400" :
                    "text-gray-500"
                  }`}>
                    {index + 1}
                  </div>

                  {player.avatar_url && (
                    <img src={player.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{player.steam_name}</div>
                    <div className="text-xs text-gray-400">
                      {player.wins}W / {player.losses}L
                      <span className="text-gray-600"> · </span>
                      <span className={player.net >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {player.net >= 0 ? "+" : ""}{player.net}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-medium ${rank.color}`}>{rank.name}</div>
                    <div className="text-xs text-gray-400">
                      {currentTab === "monthly" ? `${player.net >= 0 ? "+" : ""}${player.net} net` : `${player.xp} XP`}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-16 text-gray-500">No players yet</div>
          )}
        </div>
      </main>
    </div>
  )
}