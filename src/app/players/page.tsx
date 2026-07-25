import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getRank } from "@/lib/ranks"

export default async function PlayersPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .order("xp", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
	  <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
    ← Back to Hub
  </Link>
        <h1 className="text-3xl font-bold mb-2">Players</h1>
        <p className="text-gray-400 text-sm mb-8">Browse Citadel profiles</p>

        <div className="space-y-3">
          {players && players.length > 0 ? (
            players.map((player) => {
              const rank = getRank(player.xp || 0)
              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center justify-between bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 hover:border-[#FF5C00]/40 transition"
                >
                  <div className="flex items-center gap-4">
                    {player.avatar_url && (
                      <img src={player.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium">{player.steam_name}</div>
                      <div className="text-sm text-gray-400">
                        {player.wins}W / {player.losses}L • {player.xp} XP
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${rank.bg} ${rank.color}`}>
                    {rank.name}
                  </span>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-16 text-gray-500">No players found</div>
          )}
        </div>
      </main>
    </div>
  )
}