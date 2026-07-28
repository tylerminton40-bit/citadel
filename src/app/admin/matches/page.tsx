import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { forceWinner } from "./actions"

const ADMIN_STEAM_ID = "76561199480856629"

type MatchRow = {
  id: string
  format: string
  best_of: string
  ruleset: string
  region: string
  status: string
  private_code: string | null
  creator_report: string | null
  opponent_report: string | null
  accepted_at: string | null
  completed_at: string | null
  created_at: string
  deadlock_match_id: string | null
  result_source: string | null
  creator_id: string
  opponent_id: string | null
  creator: { steam_name: string; avatar_url: string | null } | null
  opponent: { steam_name: string; avatar_url: string | null } | null
  creator_team: { name: string; tag: string | null } | null
  opponent_team: { name: string; tag: string | null } | null
  winner: { steam_name: string } | null
}

export default async function AdminMatchesPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  if (!steamId || steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id,
      format,
      best_of,
      ruleset,
      region,
      status,
      private_code,
      creator_report,
      opponent_report,
      accepted_at,
      completed_at,
      created_at,
      deadlock_match_id,
      result_source,
      creator_id,
      opponent_id,
      creator:profiles!matches_creator_id_fkey(steam_name, avatar_url),
      opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url),
      creator_team:teams!matches_creator_team_id_fkey(name, tag),
      opponent_team:teams!matches_opponent_team_id_fkey(name, tag),
      winner:profiles!matches_winner_id_fkey(steam_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  const allMatches = (matches || []) as unknown as MatchRow[]

  const open = allMatches.filter((m) => m.status === "open")
  const accepted = allMatches.filter((m) => m.status === "accepted")
  const completed = allMatches.filter((m) => m.status === "completed")
  const disputed = allMatches.filter((m) => m.status === "disputed")

  function MatchCard({ match }: { match: MatchRow }) {
    const creatorName = match.creator_team
      ? `${match.creator_team.tag ? `[${match.creator_team.tag}] ` : ""}${match.creator_team.name}`
      : match.creator?.steam_name || "Unknown"

    const opponentName = match.opponent_team
      ? `${match.opponent_team.tag ? `[${match.opponent_team.tag}] ` : ""}${match.opponent_team.name}`
      : match.opponent?.steam_name || "Waiting..."

    return (
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link href={`/matches/${match.id}`} className="text-xs text-gray-400 hover:text-white">
            {match.format} • {match.best_of} • {match.ruleset}
          </Link>
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
              match.status === "open"
                ? "bg-yellow-500/20 text-yellow-400"
                : match.status === "accepted"
                ? "bg-emerald-500/20 text-emerald-400"
                : match.status === "completed"
                ? "bg-blue-500/20 text-blue-400"
                : match.status === "disputed"
                ? "bg-red-500/20 text-red-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {match.status.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-sm">{creatorName}</div>
            <div className="text-xs text-gray-500">Host</div>
          </div>

          <div className="text-[#FF5C00] font-bold text-sm">VS</div>

          <div className="flex-1 min-w-0 text-right">
            <div className="font-medium truncate text-sm">{opponentName}</div>
            <div className="text-xs text-gray-500">Challenger</div>
          </div>
        </div>

        {match.status === "completed" && match.winner && (
          <div className="text-xs text-emerald-400 mb-3">
            Winner: {match.winner.steam_name}
            {match.result_source === "api" && " (Auto)"}
            {match.result_source === "admin" && " (Admin Forced)"}
          </div>
        )}

        {match.status === "accepted" && (
          <div className="text-xs text-gray-500 mb-3">
            {match.creator_report || match.opponent_report
              ? "Waiting for second report"
              : "No reports yet"}
            {match.private_code && ` • Code: ${match.private_code}`}
          </div>
        )}

        {/* Force Winner (only if not completed) */}
        {match.status !== "completed" && match.opponent_id && (
          <div className="flex gap-2 mt-2">
            <form action={forceWinner.bind(null, match.id, "creator")}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition"
              >
                Force Host Win
              </button>
            </form>
            <form action={forceWinner.bind(null, match.id, "opponent")}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition"
              >
                Force Challenger Win
              </button>
            </form>
            <Link
              href={`/matches/${match.id}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-600/20 text-gray-300 border border-gray-500/30 hover:bg-gray-600/30 transition"
            >
              Open Match
            </Link>
          </div>
        )}

        {match.status === "completed" && (
          <Link
            href={`/matches/${match.id}`}
            className="inline-block text-xs px-3 py-1.5 rounded-lg bg-gray-600/20 text-gray-300 border border-gray-500/30 hover:bg-gray-600/30 transition mt-2"
          >
            Open Match
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Admin Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5C00]">Admin Hub</h1>
            <p className="text-sm text-gray-400 mt-1">Manage matches & tickets</p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/matches"
              className="px-4 py-2 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40 text-sm font-medium"
            >
              Matches
            </Link>
            <Link
              href="/admin/tickets"
              className="px-4 py-2 rounded-xl bg-[#111118] text-gray-300 border border-[#1c1c28] hover:border-gray-500 text-sm font-medium transition"
            >
              Tickets
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#111118] border border-[#1c1c28] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{open.length}</div>
            <div className="text-xs text-gray-400 mt-1">Open</div>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{accepted.length}</div>
            <div className="text-xs text-gray-400 mt-1">Live / Accepted</div>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{completed.length}</div>
            <div className="text-xs text-gray-400 mt-1">Completed</div>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{disputed.length}</div>
            <div className="text-xs text-gray-400 mt-1">Disputed</div>
          </div>
        </div>

        {/* Live / Accepted */}
        {accepted.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-emerald-400">
              Currently Playing ({accepted.length})
            </h2>
            <div className="grid gap-3">
              {accepted.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* Open */}
        {open.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">
              Open Matches ({open.length})
            </h2>
            <div className="grid gap-3">
              {open.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* Disputed */}
        {disputed.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-red-400">
              Disputed ({disputed.length})
            </h2>
            <div className="grid gap-3">
              {disputed.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Completed */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-blue-400">
            Recent Completed ({completed.length})
          </h2>
          <div className="grid gap-3">
            {completed.length > 0 ? (
              completed.map((m) => <MatchCard key={m.id} match={m} />)
            ) : (
              <div className="text-center py-12 text-gray-500">No completed matches yet</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}