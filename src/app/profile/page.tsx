import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getRank, getNextRank } from "@/lib/ranks"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  const xp = profile.xp || 0
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)

  const progress = nextRank
    ? Math.min(100, ((xp - rank.xp) / (nextRank.xp - rank.xp)) * 100)
    : 100

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <nav className="border-b border-[#1c1c28] bg-[#050508]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] flex items-center justify-center font-bold text-black text-sm">
              C
            </div>
            <span className="font-bold text-xl tracking-wide">CITADEL</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ranks" className="text-sm text-gray-400 hover:text-white">Ranks</Link>
            <a href="/api/logout" className="text-sm text-red-400 hover:text-red-300">Logout</a>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className={`bg-[#111118] border ${rank.border} rounded-2xl p-8 text-center`}>
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-28 h-28 rounded-full mx-auto mb-5 border-4 border-[#FF5C00]"
            />
          )}

          <h1 className="text-3xl font-bold mb-2">{profile.steam_name}</h1>

          <div className={`inline-block px-4 py-1.5 rounded-full ${rank.bg} ${rank.color} font-bold text-sm mb-8`}>
            {rank.name}
          </div>

          {/* XP Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextRank ? `${nextRank.xp.toLocaleString()} XP` : "Max Rank"}</span>
            </div>
            <div className="h-3 bg-[#1c1c28] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {nextRank && (
              <p className="text-xs text-gray-500 mt-2">
                {nextRank.xp - xp} XP until {nextRank.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#FF5C00]">{xp}</div>
              <div className="text-xs text-gray-400">XP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{profile.wins || 0}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{profile.losses || 0}</div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}