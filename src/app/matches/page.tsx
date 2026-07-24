import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

type Match = {
  id: string
  format: string
  region: string
  ruleset: string
  status: string
  created_at: string
  best_of?: string
  creator: {
    steam_name: string
    avatar_url: string | null
    xp: number
  } | null
  opponent?: {
    steam_name: string
    avatar_url: string | null
  } | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const currentTab = tab || "open"

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

  let matchesQuery = supabase
    .from("matches")
    .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url, xp), opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(30)

  if (currentTab === "open") {
    matchesQuery = matchesQuery.eq("status", "open")
  } else if (currentTab === "yours" && profile) {
    matchesQuery = matchesQuery.or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
  }

  const { data: matches } = await matchesQuery
  const typedMatches = (matches || []) as Match[]

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Match Finder</h1>
            <p className="text-gray-400 text-sm mt-1">
              1v1–4v4 = Street Brawl • 6v6 = Normal
            </p>
          </div>
          <Link href="/matches/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
            + Create Match
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Link
            href="/matches?tab=open"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentTab === "open"
                ? "bg-[#FF5C00] text-black"
                : "bg-[#111118] text-gray-400 hover:text-white"
            }`}
          >
            Open Matches
          </Link>
          <Link
            href="/matches?tab=yours"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentTab === "yours"
                ? "bg-[#FF5C00] text-black"
                : "bg-[#111118] text-gray-400 hover:text-white"
            }`}
          >
            Your Matches
          </Link>
        </div>

        <div className="space-y-4">
          {typedMatches.length > 0 ? (
            typedMatches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 flex items-center justify-between hover:border-[#FF5C00]/40 transition block"
              >
                <div className="flex items-center gap-4">
                  {match.creator?.avatar_url && (
                    <img src={match.creator.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  )}
                  <div>
                    <div className="font-medium">{match.creator?.steam_name || "Unknown"}</div>
                    <div className="text-sm text-gray-400">
                      {match.format} • {match.best_of || "Bo1"} • {match.region} • {match.ruleset}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">{timeAgo(match.created_at)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    match.status === "open" ? "bg-yellow-500/15 text-yellow-400" :
                    match.status === "accepted" ? "bg-emerald-500/15 text-emerald-400" :
                    "bg-gray-500/15 text-gray-400"
                  }`}>
                    {match.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-gray-500">
              {currentTab === "open" ? "No open matches right now." : "You have no matches yet."}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
