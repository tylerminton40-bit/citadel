import Link from "next/link"
import Navbar from "@/components/Navbar"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { getRank } from "@/lib/ranks"
import HomeOpenMatches from "@/components/HomeOpenMatches"

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default async function Home() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let profile = null
  if (steamId) {
    const { data } = await supabase.from("profiles").select("*").eq("steam_id", steamId).single()
    profile = data
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#08080d] text-gray-200">
        <Navbar />
        <section className="relative pt-28 pb-28 text-center px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5C00]/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></span>
              LIVE • Deadlock Competitive Platform
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1]">
              COMPETE FOR<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]">GLORY</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
              XP matches, exclusive ranks, disputes, and a real competitive ladder for Deadlock.
            </p>
            <a href="/api/steam/login" className="btn-primary px-10 py-4 rounded-xl text-base font-semibold glow-orange">
              Login with Steam
            </a>
          </div>
        </section>
      </div>
    )
  }

  const rank = getRank(profile.xp || 0)

  const { data: openMatches } = await supabase
    .from("matches")
    .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6)

  const { data: yourMatches } = await supabase
    .from("matches")
    .select("*, creator:profiles!matches_creator_id_fkey(steam_name), opponent:profiles!matches_opponent_id_fkey(steam_name)")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(5)

  const today = new Date().toISOString().slice(0, 10)
  const { data: quests } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", profile.id)
    .eq("quest_date", today)

  const { data: topEarners } = await supabase
    .from("profiles")
    .select("*")
    .order("wins", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Top status strip */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full border-2 border-[#FF5C00]" />
            )}
            <div>
              <div className="font-bold text-lg">{profile.steam_name}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${rank.bg} ${rank.color}`}>{rank.name}</span>
                <span className="text-gray-400">{profile.xp} XP</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400">{profile.wins}W</span>
                <span className="text-red-400">{profile.losses}L</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/matches/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
              + Create Match
            </Link>
            <Link href="/matches" className="px-5 py-2.5 rounded-xl border border-[#1c1c28] text-sm hover:border-[#FF5C00]/50 transition">
              Find Match
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Open Matches</h2>
                <Link href="/matches" className="text-xs text-[#FF5C00] hover:underline">View all →</Link>
              </div>
              <HomeOpenMatches initialMatches={openMatches || []} />
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Your Matches</h2>
                <Link href="/matches?tab=yours" className="text-xs text-[#FF5C00] hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {yourMatches && yourMatches.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  yourMatches.map((m: any) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#08080d] hover:bg-[#0c0c14] transition"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {m.creator?.steam_name} vs {m.opponent?.steam_name || "Waiting..."}
                        </div>
                        <div className="text-xs text-gray-500">{m.format} • {m.best_of}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === "open" ? "bg-yellow-500/15 text-yellow-400" :
                        m.status === "accepted" ? "bg-emerald-500/15 text-emerald-400" :
                        m.status === "completed" ? "bg-blue-500/15 text-blue-400" :
                        m.status === "disputed" ? "bg-red-500/15 text-red-400" :
                        "bg-gray-500/15 text-gray-400"
                      }`}>
                        {m.status}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 py-6 text-center">No matches yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Daily Quests</h2>
                <Link href="/quests" className="text-xs text-[#FF5C00] hover:underline">All →</Link>
              </div>
              <div className="space-y-3">
                {quests && quests.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  quests.slice(0, 3).map((q: any) => (
                    <div key={q.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{q.quest_key.replace("_", " ")}</span>
                        <span>{q.progress}/{q.target}</span>
                      </div>
                      <div className="h-1.5 bg-[#1c1c28] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF5C00] rounded-full"
                          style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No quests yet — visit Quests page</div>
                )}
              </div>
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Top Earners</h2>
                <Link href="/leaderboard" className="text-xs text-[#FF5C00] hover:underline">Full →</Link>
              </div>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {topEarners?.map((p: any, i: number) => (
                  <Link key={p.id} href={`/players/${p.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                    <span className={`w-5 text-xs font-bold ${
                      i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-600"
                    }`}>{i + 1}</span>
                    {p.avatar_url && <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                    <span className="text-sm flex-1 truncate">{p.steam_name}</span>
                    <span className="text-xs text-gray-500">{p.wins}W</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}