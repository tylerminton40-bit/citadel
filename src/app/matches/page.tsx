import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import MatchList from "@/components/MatchList"

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>
}) {
  const { tab, error } = await searchParams
  const currentTab = tab || "open"

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/matches")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/matches")

  let initialMatches: unknown[] = []

  if (currentTab === "open") {
    const { data } = await supabase
      .from("matches")
      .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url), opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30)
    initialMatches = data || []
  } else {
    // yours — filled by client poll; seed with captain matches
    const { data } = await supabase
      .from("matches")
      .select("*, creator:profiles!matches_creator_id_fkey(steam_name, avatar_url), opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url)")
      .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(30)
    initialMatches = data || []
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Match Finder</h1>
            <p className="text-gray-400 text-sm mt-1">Find XP matches and climb the ranks</p>
          </div>
          <Link href="/matches/create" className="btn-primary px-4 sm:px-5 py-2.5 rounded-xl text-sm shrink-0">
            + Create
          </Link>
        </div>

        {error === "already_in_match" && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            You already have a pending match. Report or cancel it first.
          </div>
        )}
        {error === "pending_with_player" && (
          <div className="mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm">
            You already have a pending match with this player.
          </div>
        )}
        {error === "dispute_with_player" && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            You have an open dispute with this player. Resolve it before queuing again.
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <Link
            href="/matches?tab=open"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentTab === "open"
                ? "bg-[#FF5C00] text-black"
                : "bg-[#111118] text-gray-400 hover:text-white"
            }`}
          >
            Open
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

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MatchList initialMatches={initialMatches as any} currentTab={currentTab} />
      </main>
    </div>
  )
}