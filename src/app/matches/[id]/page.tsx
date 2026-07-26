import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { cancelMatch, acceptMatch, reportResult } from "../actions"
import MatchLive from "@/components/MatchLive"
import CopyButton from "@/components/CopyButton"

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

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Status */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
          <div className="text-xs sm:text-sm text-gray-400 truncate">
            {match.format} • {match.best_of} • {match.region}
          </div>
          <div className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${
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

        {/* Head to Head - stacks on mobile */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-3 items-center gap-2 sm:gap-6">
            {/* Host */}
            <div className="text-center">
              {match.creator?.avatar_url ? (
                <img
                  src={match.creator.avatar_url}
                  alt=""
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-[#FF5C00]"
                />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 bg-[#1c1c28]" />
              )}
              <div className="font-bold text-sm sm:text-lg truncate px-1">{match.creator?.steam_name || "Unknown"}</div>
              <div className="text-[10px] sm:text-sm text-gray-400 mt-0.5">Host</div>
              <div className="text-[10px] sm:text-xs text-[#FF5C00] font-medium">Hidden King</div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-black text-[#FF5C00] mb-1 sm:mb-2">VS</div>
              <div className="text-[10px] sm:text-sm text-gray-400">{match.map}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{match.best_of}</div>
            </div>

            {/* Challenger */}
            <div className="text-center">
              {match.opponent?.avatar_url ? (
                <img
                  src={match.opponent.avatar_url}
                  alt=""
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-purple-500"
                />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-[10px] sm:text-sm">
                  Wait
                </div>
              )}
              <div className="font-bold text-sm sm:text-lg truncate px-1">{match.opponent?.steam_name || "Waiting..."}</div>
              <div className="text-[10px] sm:text-sm text-gray-400 mt-0.5">Challenger</div>
              <div className="text-[10px] sm:text-xs text-purple-400 font-medium">Archmother</div>
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-bold mb-3 sm:mb-4 text-[#FF5C00] text-sm sm:text-base">Match Info</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Format</span><span>{match.format}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Best Of</span><span>{match.best_of}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Region</span><span>{match.region}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Mode</span><span>{match.ruleset}</span></div>
          </div>
        </div>

    {/* Instructions */}
{(() => {
  const isNormal = match.ruleset === "Normal"
  const isSmallFormat = ["1v1", "2v2", "3v3"].includes(match.format)
  const showNormalSteps = isNormal && isSmallFormat && isAccepted

  if (showNormalSteps) {
    return (
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-5">
        <div>
          <h3 className="font-bold mb-2 text-[#FF5C00] text-sm sm:text-base">Rules</h3>
          <ul className="text-xs sm:text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>No Urn — decays instantly if picked up</li>
            <li>No Rift — never spawns</li>
          </ul>
        </div>

        {/* Challenger only */}
        {isOpponent && (
          <div>
            <h3 className="font-bold mb-2 text-purple-400 text-sm sm:text-base">Challenger Instructions</h3>
            <ol className="text-xs sm:text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Wait for the host to post the connect code below</li>
              <li>Open console and paste the connect code</li>
              <li>Choose <strong className="text-white">Archmother</strong> and your character</li>
              <li>Wait for host to unpause</li>
            </ol>
          </div>
        )}

        {/* Host only */}
        {isCreator && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#FF5C00] text-sm sm:text-base">Host Steps</h3>

            {/* Step 1 */}
            <div className="bg-[#08080d] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300">Step 1 — Join the map (leave console open)</span>
                <CopyButton text="map dl_midtown" />
              </div>
              <code className="text-xs text-[#FF5C00] break-all">map dl_midtown</code>
            </div>

            {/* Step 2 */}
            <div className="bg-[#08080d] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300">Step 2 — Pause + setup (paste as soon as you load in)</span>
                <CopyButton text="sv_cheats 1; citadel_pause; status; citadel_idol_duration_until_decay 1; citadel_idol_decay_duration 1; citadel_koth_spawn_initial_delay 9999999; citadel_active_lane 4" />
              </div>
              <code className="text-xs text-[#FF5C00] break-all">
                sv_cheats 1; citadel_pause; status; citadel_idol_duration_until_decay 1; citadel_idol_decay_duration 1; citadel_koth_spawn_initial_delay 9999999; citadel_active_lane 4
              </code>
              <p className="text-[11px] text-gray-500 mt-2">This pauses the game so your opponent can join.</p>
            </div>

      {/* Step 3 */}
<div className="bg-[#08080d] rounded-xl p-4">
  <div className="text-xs font-bold text-gray-300 mb-2">Step 3 — Post your connect code</div>
  <p className="text-[11px] text-gray-500 mb-3">
    After running the command above, look in console for the line with <code className="text-gray-400">steamid</code>.
    Copy the long number and the brackets and submit it as the Match Code below.
    The copy button will format it as <code className="text-[#FF5C00]">connect YOURCODE</code>.
  </p>
  <img
    src="/console-steamid-example.png"
    alt="Console steamid example"
    className="w-full rounded-lg border border-[#1c1c28] mb-2"
  />
  <p className="text-[11px] text-gray-500">
    Example: copy <span className="text-[#FF5C00] font-mono">[90289632610184204]</span> (the number and the brackets)
  </p>
</div>

            {/* Step 4 */}
            <div className="bg-[#08080d] rounded-xl p-4">
              <div className="text-xs font-bold text-gray-300 mb-1">Step 4 — Unpause</div>
              <p className="text-[11px] text-gray-500">
                When opponent is in, press <strong className="text-white">P</strong> to unpause and start the match.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default instructions (Street Brawl or Normal 4v4/6v6)
  return (
    <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="font-bold mb-3 text-[#FF5C00] text-sm sm:text-base">How to Join</h3>
      <ol className="text-xs sm:text-sm text-gray-400 space-y-1.5 sm:space-y-2 list-decimal list-inside">
        <li>Open <strong className="text-white">Deadlock</strong></li>
        <li>Go to <strong className="text-white">Private Match</strong></li>
        <li>Host creates lobby ({match.ruleset} {match.format})</li>
        <li>Host posts the <strong className="text-white">Join Code</strong> below</li>
        <li>Other player joins with the code</li>
        <li>Play ({match.best_of}) then both report the result</li>
      </ol>
    </div>
  )
})()}

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
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mt-8 sm:mt-10">
          {isOpen && !isCreator && (
            <form action={async () => { "use server"; await acceptMatch(id) }} className="w-full sm:w-auto">
              <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl">Accept Match</button>
            </form>
          )}

          {isOpen && isCreator && (
            <form action={async () => { "use server"; await cancelMatch(id) }} className="w-full sm:w-auto">
              <button type="submit" className="w-full sm:w-auto px-8 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition">
                Cancel Match
              </button>
            </form>
          )}

          {isAccepted && isParticipant && (
            <>
              {((isCreator && !match.creator_report) || (isOpponent && !match.opponent_report)) ? (
                <form action={reportResult.bind(null, id)} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
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
                <div className="px-5 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium text-center">
                  You reported • Waiting for opponent
                </div>
              )}
            </>
          )}

          <Link href="/matches" className="w-full sm:w-auto text-center px-8 py-3 rounded-xl border border-[#1c1c28] hover:border-gray-500 transition">
            Back to Matches
          </Link>
        </div>
      </main>
    </div>
  )
}