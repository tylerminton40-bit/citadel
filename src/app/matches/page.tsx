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
}

export default async function MatchesPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: matches } = await supabase
    .from("matches")
    .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url, xp)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20)

  const typedMatches = (matches || []) as Match[]

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Match Finder</h1>
            <p className="text-gray-400 text-sm mt-1">
              1v1–4v4 = Street Brawl • 6v6 = Normal
            </p>
          </div>
          <Link
            href="/matches/create"
            className="btn-primary px-5 py-2.5 rounded-xl text-sm"
          >
            + Create Match
          </Link>
        </div>

        <div className="space-y-4">
          {typedMatches.length > 0 ? (
            typedMatches.map((match) => (
              <Link
                href={`/matches/${match.id}`}
                key={match.id}
                className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 flex items-center justify-between hover:border-[#FF5C00]/40 transition block"
              >
                <div className="flex items-center gap-4">
                  {match.creator?.avatar_url && (
                    <img
                      src={match.creator.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {match.creator?.steam_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {match.format} • {match.best_of || "Bo1"} • {match.region} • {match.ruleset}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#FF5C00]/15 text-[#FF5C00] font-medium">
                    {match.format === "6v6" ? "Normal" : "Street Brawl"}
                  </span>
                  <span className="text-sm text-gray-400">View →</span>
                </div>
              </Link>
            ))