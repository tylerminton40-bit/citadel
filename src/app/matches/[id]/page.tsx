import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { cancelMatch, acceptMatch, reportResult, disputeMatch, checkMatchResult } from "../actions"
import MatchLive from "@/components/MatchLive"
import CopyButton from "@/components/CopyButton"
import AutoDetectPoller from "@/components/AutoDetectPoller"

type TeamMember = {
  profile: {
    steam_name: string
    avatar_url: string | null
    xp: number
  } | null
}

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}) {
  const { id } = await params
  const { auto } = await searchParams
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  const isAdmin = steamId === "76561199480856629"
  if (!steamId) redirect("/login?next=/matches")

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
      creator:profiles!matches_creator_id_fkey(id, steam_name, avatar_url, xp, steam_id),
      opponent:profiles!matches_opponent_id_fkey(id, steam_name, avatar_url, xp, steam_id),
      creator_team:teams!matches_creator_team_id_fkey(id, name, tag, size, wins, losses),
      opponent_team:teams!matches_opponent_team_id_fkey(id, name, tag, size, wins, losses)
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

  let creatorMembers: TeamMember[] = []
  let opponentMembers: TeamMember[] = []

  if (match.creator_team_id) {
    const { data } = await supabase
      .from("team_members")
      .select("profile:profiles(steam_name, avatar_url, xp)")
      .eq("team_id", match.creator_team_id)
    creatorMembers = (data as unknown as TeamMember[]) || []
  }

  if (match.opponent_team_id) {
    const { data } = await supabase
      .from("team_members")
      .select("profile:profiles(steam_name, avatar_url, xp)")
      .eq("team_id", match.opponent_team_id)
    opponentMembers = (data as unknown as TeamMember[]) || []
  }

  let myCaptainTeams: { id: string; name: string; tag: string | null; size: number }[] = []
  if (profile?.id) {
    const { data: owned } = await supabase
      .from("teams")
      .select("id, name, tag, size, is_scrim")
      .eq("owner_id", profile.id)
      .eq("is_scrim", false)
    myCaptainTeams = (owned || []).map((t) => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
      size: t.size,
    }))
  }

    const { data: messages } = await supabase
    .from("match_messages")
    .select("*, sender:profiles(steam_name, steam_id)")
    .eq("match_id", id)
    .order("created_at", { ascending: true })

  const isCreator = profile?.id === match.creator_id
  const isOpponent = profile?.id === match.opponent_id
  const isCaptain = isCreator || isOpponent

  let isOnCreatorTeam = false
  let isOnOpponentTeam = false

  if (profile?.id && match.creator_team_id) {
    const { data } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", match.creator_team_id)
      .eq("profile_id", profile.id)
      .maybeSingle()
    isOnCreatorTeam = !!data
  }

  if (profile?.id && match.opponent_team_id) {
    const { data } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", match.opponent_team_id)
      .eq("profile_id", profile.id)
      .maybeSingle()
    isOnOpponentTeam = !!data
  }

  const isParticipant = isCaptain || isOnCreatorTeam || isOnOpponentTeam
  const isOpen = match.status === "open"
  const isAccepted = match.status === "accepted"
  const isCompleted = match.status === "completed"
  const isPendingResult = isAccepted && (match.creator_report || match.opponent_report)

  const isNormal = match.ruleset?.startsWith("Normal")
  const isStreet = match.ruleset?.startsWith("Street")
  const isSmallFormat = ["1v1", "2v2", "3v3", "4v4"].includes(match.format)
  const showNormalSteps = isNormal && isSmallFormat && isAccepted
  const showPrivateCodeSteps =
    isAccepted && (isStreet || match.format === "6v6" || (isNormal && match.format === "6v6"))

  const neededSize =
    match.format === "2v2"
      ? 2
      : match.format === "3v3"
      ? 3
      : match.format === "4v4"
      ? 4
      : match.format === "6v6"
      ? 6
      : 1

  const acceptTeams = myCaptainTeams.filter((t) => t.size === neededSize)

  const hasReports = !!(match.creator_report || match.opponent_report)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      {/* Automatic background detection */}
      {isAccepted && isCaptain && !hasReports && (
        <AutoDetectPoller
          matchId={id}
          acceptedAt={match.accepted_at}
          hasReports={hasReports}
        />
      )}

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Auto-detect feedback messages */}
        {auto === "notfound" && (
          <div className="mb-6 p-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-sm text-center">
            No private match found in the Deadlock API.
            <br />
            Please report the result manually, or upload your matches on{" "}
            <a href="https://statlocker.gg" target="_blank" className="underline">
              Statlocker.gg
            </a>{" "}
            and try again.
          </div>
        )}

        {auto === "success" && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm text-center">
            Match result automatically detected and applied!
          </div>
        )}

        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
          <div className="text-xs sm:text-sm text-gray-400 truncate">
            {match.format} • {match.best_of} • {match.region} • {match.ruleset}
          </div>
          <div
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${
              isOpen
                ? "bg-yellow-500/20 text-yellow-400"
                : match.status === "disputed"
                ? "bg-red-500/20 text-red-400"
                : isCompleted
                ? "bg-blue-500/20 text-blue-400"
                : isPendingResult
                ? "bg-orange-500/20 text-orange-400"
                : isAccepted
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {isOpen
              ? "OPEN"
              : match.status === "disputed"
              ? "DISPUTED"
              : isCompleted
              ? "COMPLETED"
              : isPendingResult
              ? "PENDING RESULT"
              : isAccepted
              ? "ACCEPTED"
              : match.status.toUpperCase()}
          </div>
        </div>

        {isOpen && !isCreator && profile && (
          <div className="mb-6 p-4 rounded-2xl border border-[#FF5C00]/40 bg-[#FF5C00]/10">
            {neededSize > 1 ? (
              acceptTeams.length > 0 ? (
                <form action={acceptMatch.bind(null, id)} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <select
                    name="team_id"
                    required
                    className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm"
                  >
                    {acceptTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tag ? `[${t.tag}] ` : ""}
                        {t.name} · {t.size}v{t.size}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary px-8 py-3 rounded-xl font-bold">
                    Accept Match
                  </button>
                </form>
              ) : (
                <p className="text-sm text-center text-gray-300">
                  You need a normal (non-scrim) team you captain with {neededSize} players to accept.
                </p>
              )
            ) : (
              <form action={acceptMatch.bind(null, id)} className="text-center">
                <button type="submit" className="btn-primary px-10 py-3 rounded-xl font-bold">
                  Accept Match
                </button>
              </form>
            )}
          </div>
        )}

        {isOpen && isCreator && (
          <div className="mb-6 text-center">
            <form action={cancelMatch.bind(null, id)}>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
              >
                Cancel Match
              </button>
            </form>
          </div>
        )}

        {/* Head to Head */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-3 items-start gap-2 sm:gap-6">
            <div className="text-center">
              {match.creator_team ? (
                <>
                  <div className="font-bold text-sm sm:text-lg text-[#FF5C00] mb-1">
                    {match.creator_team.tag ? `[${match.creator_team.tag}] ` : ""}
                    {match.creator_team.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    <span className="text-emerald-400">{match.creator_team.wins}W</span>
                    {" / "}
                    <span className="text-red-400">{match.creator_team.losses}L</span>
                  </div>
                  <div className="space-y-2">
                    {creatorMembers.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 justify-center">
                        {m.profile?.avatar_url && (
                          <img src={m.profile.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        )}
                        <div className="text-left min-w-0">
                          <div className="text-xs font-medium truncate">{m.profile?.steam_name}</div>
                          <div className="text-[10px] text-gray-500">{m.profile?.xp || 0} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#FF5C00] font-medium mt-2">
                    Host • Hidden King
                  </div>
                </>
              ) : (
                <>
                  {match.creator?.avatar_url ? (
                    <img
                      src={match.creator.avatar_url}
                      alt=""
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-[#FF5C00]"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 bg-[#1c1c28]" />
                  )}
                  <div className="font-bold text-sm sm:text-lg truncate px-1">
                    {match.creator?.steam_name || "Unknown"}
                  </div>
                  <div className="text-[10px] sm:text-sm text-gray-400 mt-0.5">Host</div>
                  <div className="text-[10px] sm:text-xs text-[#FF5C00] font-medium">Hidden King</div>
                </>
              )}
            </div>

            <div className="text-center pt-4 sm:pt-8">
              <div className="text-2xl sm:text-4xl font-black text-[#FF5C00] mb-1 sm:mb-2">VS</div>
              <div className="text-[10px] sm:text-sm text-gray-400">{match.format}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{match.best_of}</div>
              <div className="text-[10px] sm:text-xs text-gray-500">{match.ruleset}</div>
            </div>

            <div className="text-center">
              {match.opponent_team ? (
                <>
                  <div className="font-bold text-sm sm:text-lg text-purple-400 mb-1">
                    {match.opponent_team.tag ? `[${match.opponent_team.tag}] ` : ""}
                    {match.opponent_team.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    <span className="text-emerald-400">{match.opponent_team.wins}W</span>
                    {" / "}
                    <span className="text-red-400">{match.opponent_team.losses}L</span>
                  </div>
                  <div className="space-y-2">
                    {opponentMembers.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 justify-center">
                        {m.profile?.avatar_url && (
                          <img src={m.profile.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        )}
                        <div className="text-left min-w-0">
                          <div className="text-xs font-medium truncate">{m.profile?.steam_name}</div>
                          <div className="text-[10px] text-gray-500">{m.profile?.xp || 0} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs text-purple-400 font-medium mt-2">
                    Challenger • Archmother
                  </div>
                </>
              ) : match.opponent ? (
                <>
                  {match.opponent.avatar_url ? (
                    <img
                      src={match.opponent.avatar_url}
                      alt=""
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-purple-500"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 bg-[#1c1c28]" />
                  )}
                  <div className="font-bold text-sm sm:text-lg truncate px-1">
                    {match.opponent.steam_name}
                  </div>
                  <div className="text-[10px] sm:text-sm text-gray-400 mt-0.5">Challenger</div>
                  <div className="text-[10px] sm:text-xs text-purple-400 font-medium">Archmother</div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-2 sm:mb-3 border-2 sm:border-4 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-[10px] sm:text-sm">
                    Wait
                  </div>
                  <div className="font-bold text-sm sm:text-lg truncate px-1">Waiting...</div>
                  <div className="text-[10px] sm:text-sm text-gray-400 mt-0.5">Challenger</div>
                  <div className="text-[10px] sm:text-xs text-purple-400 font-medium">Archmother</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-bold mb-3 sm:mb-4 text-[#FF5C00] text-sm sm:text-base">Match Info</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Format</span>
              <span>{match.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Best Of</span>
              <span>{match.best_of}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Region</span>
              <span>{match.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mode</span>
              <span>{match.ruleset}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {showNormalSteps ? (
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-6">
            {(isOpponent || isOnOpponentTeam) && (
              <div>
                <h3 className="font-bold mb-2 text-purple-400 text-sm sm:text-base">
                  Challenger Instructions
                </h3>
                <ol className="text-xs sm:text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
                  <li>Wait for the host to post the connect code below</li>
                  <li>Open console and paste the connect code</li>
                  <li>
                    Choose <strong className="text-white">Archmother</strong> and your character
                  </li>
                  <li>Wait for host to unpause</li>
                </ol>
              </div>
            )}

            {isCreator && (
              <div className="space-y-4">
                <h3 className="font-bold text-[#FF5C00] text-sm sm:text-base">Host Steps</h3>

                <div className="bg-[#08080d] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300">
                      Step 1 — Join the map (leave console open)
                    </span>
                    <CopyButton text="map dl_midtown" />
                  </div>
                  <code className="text-xs text-[#FF5C00] break-all">map dl_midtown</code>
                </div>

                <div className="bg-[#08080d] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300">Step 2 — Pause + setup</span>
                    <CopyButton text="sv_cheats 1; citadel_pause; status; citadel_active_lane 4" />
                  </div>
                  <code className="text-xs text-[#FF5C00] break-all">
                    sv_cheats 1; citadel_pause; status; citadel_active_lane 4
                  </code>
                  <p className="text-[11px] text-gray-500 mt-2">
                    This pauses the game so your opponent can join.
                  </p>
                </div>

                <div className="bg-[#08080d] rounded-xl p-4">
                  <div className="text-xs font-bold text-gray-300 mb-2">
                    Step 3 — Post your connect code
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">
                    From the <code className="text-gray-400">status</code> output, copy your ID
                    including the brackets.{" "}
                    <strong className="text-white">The whole thing must be copied</strong>, like:
                  </p>
                  <code className="block text-xs text-[#FF5C00] font-mono bg-[#050508] rounded-lg px-3 py-2 mb-3">
                    [A:0:1234567890:12345]
                  </code>
                  <img
                    src="/console-steamid-example.png"
                    alt="Console steamid example"
                    className="w-full rounded-lg border border-[#1c1c28] mb-2"
                  />
                  <p className="text-[11px] text-gray-500">
                    Paste that as the Match Code below. Opponent will use it to connect.
                  </p>
                </div>

                <div className="bg-[#08080d] rounded-xl p-4">
                  <div className="text-xs font-bold text-gray-300 mb-1">Step 4 — Unpause</div>
                  <p className="text-[11px] text-gray-500">
                    You can tell your opponent is in when an{" "}
                    <strong className="text-white">empty character portrait</strong> appears on the
                    other team. Then press <strong className="text-white">P</strong> to unpause.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : showPrivateCodeSteps ? (
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="font-bold mb-3 text-[#FF5C00] text-sm sm:text-base">How to Join</h3>
            <ol className="text-xs sm:text-sm text-gray-400 space-y-1.5 sm:space-y-2 list-decimal list-inside">
              <li>
                Open <strong className="text-white">Deadlock</strong>
              </li>
              <li>
                Go to <strong className="text-white">Private Match</strong>
              </li>
              <li>
                Host creates lobby ({match.ruleset} {match.format})
              </li>
              <li>
                Host posts the <strong className="text-white">Join Code</strong> below
              </li>
              <li>Other player / team joins with the code</li>
              <li>
                Play ({match.best_of}) then both captains report the result
              </li>
            </ol>
          </div>
        ) : null}

           <MatchLive
          matchId={id}
          initialCode={match.private_code}
          initialMessages={messages || []}
          isCreator={!!isCreator}
          isAccepted={isAccepted}
          isParticipant={!!isParticipant}
          isAdmin={isAdmin}
          ruleset={match.ruleset || "Street Brawl"}
        />

        {/* Report high — visible */}
        {isAccepted && isCaptain && (
          <div className="mt-8 p-5 rounded-2xl border border-[#1c1c28] bg-[#111118]">
            <h3 className="font-bold mb-3">Report result</h3>
            {(isCreator && !match.creator_report) || (isOpponent && !match.opponent_report) ? (
              <div className="space-y-3">
                <form
                  action={reportResult.bind(null, id)}
                  className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
                >
                  <select
                    name="winner"
                    required
                    className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Who won?</option>
                    <option value="creator">
                      {match.creator_team
                        ? match.creator_team.name
                        : match.creator?.steam_name}{" "}
                      won
                    </option>
                    <option value="opponent">
                      {match.opponent_team
                        ? match.opponent_team.name
                        : match.opponent?.steam_name}{" "}
                      won
                    </option>
                  </select>
                  <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
                    Report Result
                  </button>
                </form>

                <form action={checkMatchResult.bind(null, id)}>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 transition text-sm font-medium"
                  >
                    Auto Detect from Deadlock API
                  </button>
                </form>
              </div>
            ) : (
              <div className="px-5 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium text-center">
                You reported • Waiting for opponent
              </div>
            )}

            <form action={disputeMatch.bind(null, id)} className="mt-3">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition text-sm"
              >
                Open Dispute
              </button>
            </form>
          </div>
        )}

        {/* How Automatic Reporting Works */}
        {isAccepted && (
          <div className="mt-8 p-5 sm:p-6 rounded-2xl border border-[#1c1c28] bg-[#111118]">
            <h3 className="font-bold text-lg mb-4 text-[#FF5C00]">
              How Automatic Reporting Works
            </h3>

            <div className="space-y-5 text-sm text-gray-300">
              <p>
                After a match has been accepted for 10 minutes, Citadel automatically checks
                every 2 minutes for the result using the Deadlock API. If it finds the match,
                it will complete it for you.
              </p>

              <div>
                <h4 className="font-semibold text-white mb-2">Best Method (Recommended)</h4>
                <p className="mb-2">
                  Install the <strong>Statlocker Companion</strong> app through Overwolf.
                  It automatically uploads your matches in the background with zero effort.
                </p>
                <a
                  href="https://www.overwolf.com/app/statlocker.gg-statlocker_companion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition text-sm font-medium"
                >
                  Download Statlocker Companion →
                </a>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Manual Upload (If needed)</h4>
                <p className="mb-3">
                  If automatic detection fails, go to{" "}
                  <a
                    href="https://statlocker.gg"
                    target="_blank"
                    className="underline text-[#FF5C00]"
                  >
                    Statlocker.gg
                  </a>{" "}
                  and upload your recent matches.
                </p>
                <p className="mb-3 text-gray-400 text-xs">
                  Click the <strong>UPLOAD MATCHES</strong> button at the top of the page:
                </p>
                <img
                  src="/statlocker-upload.png"
                  alt="Statlocker Upload Matches button"
                  className="w-full max-w-lg rounded-xl border border-[#1c1c28]"
                />
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Other Options</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>
                    Use the official Deadlock API ingest tool (runs in the background)
                  </li>
                  <li>
                    Just report the result manually using the dropdown above (always works)
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 pt-2 border-t border-[#1c1c28]">
                Note: Private matches are not always available in the API. The manual report
                is still the most reliable method.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Link
            href="/matches"
            className="px-8 py-3 rounded-xl border border-[#1c1c28] hover:border-gray-500 transition"
          >
            Back to Matches
          </Link>
        </div>
      </main>
    </div>
  )
}