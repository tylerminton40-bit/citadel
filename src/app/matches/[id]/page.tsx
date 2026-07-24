import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      creator:profiles!matches_creator_id_fkey(id, steam_name, avatar_url, xp),
      opponent:profiles!matches_opponent_id_fkey(id, steam_name, avatar_url, xp)
    `)
    .eq("id", id)
    .single()

  if (!match) {
    return (
      <div className="min-h-screen bg-[#08080d] text-gray-200">
        <Navbar />
        <div className="text-center py-32 text-gray-500">Match not found</div>
      </div>
    )
  }

  const isCreator = match.creator?.id && steamId // simplified check for now
  const isOpen = match.status === "open"
  const isAccepted = match.status === "accepted"

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-gray-400">
            {match.format} • {match.best_of} • {match.region}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOpen ? "bg-yellow-500/20 text-yellow-400" :
            isAccepted ? "bg-emerald-500/20 text-emerald-400" :
            "bg-gray-500/20 text-gray-400"
          }`}>
            {match.status.toUpperCase()}
          </div>
        </div>

        {/* Head to Head */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-3 items-center gap-6">
            {/* Creator */}
            <div className="text-center">
              {match.creator?.avatar_url && (
                <img src={match.creator.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-[#FF5C00]" />
              )}
              <div className="font-bold text-lg">{match.creator?.steam_name || "Unknown"}</div>
              <div className="text-sm text-gray-400 mt-1">Host</div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-4xl font-black text-[#FF5C00] mb-2">VS</div>
              <div className="text-sm text-gray-400">{match.map}</div>
              <div className="text-xs text-gray-500 mt-1">{match.best_of}</div>
            </div>

            {/* Opponent */}
            <div className="text-center">
              {match.opponent?.avatar_url ? (
                <img src={match.opponent.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-purple-500" />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-sm">
                  Waiting
                </div>
              )}
              <div className="font-bold text-lg">{match.opponent?.steam_name || "Waiting..."}</div>
              <div className="text-sm text-gray-400 mt-1">Challenger</div>
            </div>
          </div>
        </div>

        {/* Match Info + Code */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
            <h3 className="font-bold mb-4 text-[#FF5C00]">Match Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Format</span><span>{match.format}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Best Of</span><span>{match.best_of}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Region</span><span>{match.region}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Mode</span><span>{match.ruleset}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Map</span><span>{match.map}</span></div>
            </div>
          </div>

          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
            <h3 className="font-bold mb-4 text-purple-400">Private Match Code</h3>
            {match.private_code ? (
              <div className="text-2xl font-mono font-bold tracking-widest text-center py-4 bg-[#08080d] rounded-xl">
                {match.private_code}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                Host will post the private match code here after accepting.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center mb-10">
          {isOpen && (
            <button className="btn-primary px-8 py-3 rounded-xl">
              Accept Match
            </button>
          )}
          <Link href="/matches" className="px-8 py-3 rounded-xl border border-[#1c1c28] hover:border-gray-500 transition">
            Back to Matches
          </Link>
        </div>

        {/* Chat Placeholder */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
          <h3 className="font-bold mb-4">Match Chat</h3>
          <div className="h-40 bg-[#08080d] rounded-xl mb-4 flex items-center justify-center text-gray-500 text-sm">
            Chat coming next
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF5C00]"
              disabled
            />
            <button className="btn-primary px-5 py-2.5 rounded-xl text-sm" disabled>
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}