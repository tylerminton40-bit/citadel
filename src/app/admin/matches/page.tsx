import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

const ADMIN_STEAM_ID = "76561199480856629"

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
      creator:profiles!matches_creator_id_fkey(steam_name, avatar_url),
      opponent:profiles!matches_opponent_id_fkey(steam_name, avatar_url),
      creator_team:teams!matches_creator_team_id_fkey(name, tag),
      opponent_team:teams!matches_opponent_team_id_fkey(name, tag),
      winner:profiles!matches_winner_id_fkey(steam_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  const open = matches?.filter((m) => m.status === "open") || []
  const accepted = matches?.filter((m) => m.status === "accepted") || []
  const completed = matches?.filter((m) => m.status === "completed") || []
  const disputed = matches?.filter((m) => m.status === "disputed") || []

  function MatchCard({ match }: { match: any }) {
    const creatorName = match.creator_team
      ? `${match.creator_team.tag ? `[${match.creator_team.tag}] ` : ""}${match.creator_team.name}`
      : match.creator?.steam_name || "Unknown"

    const opponentName = match.opponent_team
      ? `${match.opponent_team.tag ? `[${match.opponent_team.tag}] ` : ""}${match.opponent_team.name}`
      : match.opponent?.steam_name || "Waiting..."

    return (
      <Link
        href={`/matches/${match.id}`}
        className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 hover:border-[#FF5C00]/40 transition"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs text-gray-400">
            {match.format} • {match.best_of} • {match.ruleset}
          </div>
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

        <div className="flex items-center justify-between gap-4">
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
          <div className="mt-3 text-xs text-emerald-400">
            Winner: {match.winner.steam_name}
            {match.result_source === "api" && " (Auto)"}
          </div>
        )}

        {match.status === "accepted" && (
          <div className="mt-3 text-xs text-gray-500">
            {match.creator_report || match.opponent_report
              ? "Waiting for second report"
              : "No reports yet"}
            {match.private_code && ` • Code: ${match.private_code}`}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5C00]">Admin • Matches</h1>
            <p className="text-sm text-gray-400 mt-1">All matches on the platform</p>
          </div>
          <Link
            href="/admin/tickets"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Tickets →
          </Link>
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