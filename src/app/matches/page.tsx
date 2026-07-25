import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import MatchList from "@/components/MatchList"

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

        <MatchList initialMatches={matches || []} currentTab={currentTab} />
      </main>
    </div>
  )
}

