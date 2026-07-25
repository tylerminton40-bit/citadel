import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getRank, getNextRank } from "@/lib/ranks"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
    .eq("id", id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#08080d] text-gray-200">
        <Navbar />
        <div className="text-center py-32 text-gray-500">Player not found</div>
      </div>
    )
  }

  const xp = profile.xp || 0
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank
    ? Math.min(100, ((xp - rank.xp) / (nextRank.xp - rank.xp)) * 100)
    : 100

  // Check if this is your own profile
  const { data: me } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  const isOwnProfile = me?.id === profile.id

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

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

          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextRank ? `${nextRank.xp.toLocaleString()} XP` : "Max Rank"}</span>
            </div>
            <div className="h-3 bg-[#1c1c28] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mb-8">
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

          {!isOwnProfile && (
            <Link
              href={`/tickets/create?report=${profile.id}&name=${encodeURIComponent(profile.steam_name)}`}
              className="inline-block px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition"
            >
              Report Player
            </Link>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/players" className="text-sm text-gray-400 hover:text-white">
            ← Back to Players
          </Link>
        </div>
      </main>
    </div>
  )
}