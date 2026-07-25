import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { cancelMatch, acceptMatch, reportResult } from "../actions"
import MatchLive from "@/components/MatchLive"

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

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

  const { data: messages } = await supabase
    .from("match_messages")
    .select("*, sender:profiles(steam_name)")
    .eq("match_id", id)
    .order("created_at", { ascending: true })

  const isCreator = profile?.id === match.creator_id
  const isOpponent = profile?.id === match.opponent_id
  const isParticipant = isCreator || isOpponent
  const isOpen = match.status === "open"
  const isAccepted = match.status === "accepted"
  const isCompleted = match.status === "completed"
  const isPendingResult = isAccepted && (match.creator_report || match.opponent_report)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Status */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-gray-400">
            {match.format} • {match.best_of} • {match.region}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOpen ? "bg-yellow-500/20 text-yellow-400" :
            match.status === "disputed" ? "bg-red-500/20 text-red-400" :
            isCompleted ? "bg-blue-500/20 text-blue-400" :
            isPendingResult ? "bg-orange-500/20 text-orange-400" :
            isAccepted ? "bg-emerald-500/20 text-emerald-400" :
            "bg-gray-500/20 text-gray-400"
          }`}>
            {isOpen ? "OPEN" :
             match.status === "disputed" ? "DISPUTED" :
             isCompleted ? "COMPLETED" :
             isPendingResult ? "PENDING RESULT" :
             isAccepted ? "ACCEPTED" :
             match.status.toUpperCase()}
          </div>
        </div>

        {/* Head to Head */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-3 items-center gap-6">
            <div className="text-center">
              {match.creator?.avatar_url && (
                <img src={match.creator.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-[#FF5C00]" />
              )}
              <div className="font-bold text-lg">{match.creator?.steam_name || "Unknown"}</div>
              <div className="text-sm text-gray-400 mt-1">Host</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-black text-[#FF5C00] mb-2">VS</div>
              <div className="text-sm text-gray-400">{match.map}</div>
              <div className="text-xs text-gray-500 mt-1">{match.best_of}</div>
            </div>

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

        {/* Match Info */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4 text-[#FF5C00]">Match Info</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Format</span><span>{match.format}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Best Of</span><span>{match.best_of}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Region</span><span>{match.region}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Mode</span><span>{match.ruleset}</span></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-3 text-[#FF5C00]">How to Play</h3>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Host creates a Private Match in Deadlock (Street Brawl for 1v1-4v4, Normal for 6v6)</li>
            <li>Host posts the Private Match Code in the box below</li>
            <li>Both players join using the code</li>
            <li>Play the match (Best of {match.best_of})</li>
            <li>Both players report the result on this page</li>
            <li>XP is awarded when both reports match</li>
          </ol>
        </div>

        {/* Live Code + Chat */}
        <MatchLive
          matchId={id}
          initialCode={match.private_code}
          initialMessages={messages || []}
          isCreator={isCreator}
          isAccepted={isAccepted}
          isParticipant={isParticipant}
        />

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center mt-10">
          {isOpen && !isCreator && (
            <form action={async () => { "use server"; await acceptMatch(id) }}>
              <button type="submit" className="btn-primary px-8 py-3 rounded-xl">Accept Match</button>
            </form>
          )}

          {isOpen && isCreator && (
            <form action={async () => { "use server"; await cancelMatch(id) }}>
              <button type="submit" className="px-8 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition">
                Cancel Match
              </button>
            </form>
          )}

 {isAccepted && isParticipant && (
  <>
    {/* Show form only if current user hasn't reported yet */}
    {((isCreator && !match.creator_report) || (isOpponent && !match.opponent_report)) ? (
      <form action={reportResult.bind(null, id)} className="flex gap-3 items-center">
        <select name="winner" required className="bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm">
          <option value="">Who won?</option>
          <option value="creator">{match.creator?.steam_name} won</option>
          <option value="opponent">{match.opponent?.steam_name} won</option>
        </select>
        <button type="submit" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
          Report Result
        </button>
      </form>
    ) : (
      <div className="px-5 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium">
        You reported • Waiting for opponent
      </div>
    )}
  </>
)}

          <Link href="/matches" className="px-8 py-3 rounded-xl border border-[#1c1c28] hover:border-gray-500 transition">
            Back to Matches
          </Link>
        </div>
      </main>
    </div>
  )
}