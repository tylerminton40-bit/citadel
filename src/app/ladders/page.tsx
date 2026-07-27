import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getCurrentSeason } from "@/lib/ladder"

const MODES = ["1v1", "2v2", "3v3", "4v4", "6v6"] as const

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

type LadderEntry = {
  id: string
  entity_type: string
  entity_id: string
  wins: number
  losses: number
}

export default async function LaddersPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode: modeParam } = await searchParams
  const mode = MODES.includes(modeParam as (typeof MODES)[number])
    ? (modeParam as string)
    : "1v1"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const season = await getCurrentSeason()

  let entries: LadderEntry[] = []

  if (season) {
    const { data } = await supabase
      .from("ladder_entries")
      .select("*")
      .eq("season_id", season.id)
      .eq("mode", mode)
      .limit(100)

    entries = data || []
  }

  // Sort by wins - losses only (higher net first)
  entries.sort((a, b) => {
    const netA = (a.wins || 0) - (a.losses || 0)
    const netB = (b.wins || 0) - (b.losses || 0)
    if (netB !== netA) return netB - netA
    return (b.wins || 0) - (a.wins || 0)
  })

  const playerIds = entries.filter((e) => e.entity_type === "player").map((e) => e.entity_id)
  const teamIds = entries.filter((e) => e.entity_type === "team").map((e) => e.entity_id)

  type ProfileInfo = { id: string; steam_name: string; avatar_url: string | null }
  type TeamInfo = { id: string; name: string; tag: string | null; wins: number; losses: number }

  const profilesMap: Record<string, ProfileInfo> = {}
  const teamsMap: Record<string, TeamInfo> = {}

  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, steam_name, avatar_url")
      .in("id", playerIds)
    data?.forEach((p) => {
      profilesMap[p.id] = p
    })
  }

  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("teams")
      .select("id, name, tag, wins, losses")
      .in("id", teamIds)
    data?.forEach((t) => {
      teamsMap[t.id] = t
    })
  }

  const seasonLabel = season ? `${MONTHS[season.month]} ${season.year}` : "Current Season"

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Monthly Ladders</h1>
          <p className="text-gray-400 text-sm">
            {seasonLabel} · Sorted by wins − losses · Top 3 earn bonus XP
          </p>
        </div>

        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 mb-6 flex flex-wrap justify-center gap-6 text-center text-sm">
          <div>
            <div className="text-yellow-400 font-black text-lg">1st</div>
            <div className="text-gray-400">+1200 XP each</div>
          </div>
          <div>
            <div className="text-gray-300 font-black text-lg">2nd</div>
            <div className="text-gray-400">+800 XP each</div>
          </div>
          <div>
            <div className="text-orange-400 font-black text-lg">3rd</div>
            <div className="text-gray-400">+400 XP each</div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {MODES.map((m) => (
            <Link
              key={m}
              href={`/ladders?mode=${m}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition ${
                mode === m
                  ? "bg-[#FF5C00] text-black"
                  : "bg-[#111118] border border-[#1c1c28] text-gray-400 hover:text-white"
              }`}
            >
              {m}
            </Link>
          ))}
        </div>

        <div className="text-xs text-gray-500 mb-4">
          {mode === "1v1"
            ? "Solo ladder — only 1v1 matches count"
            : `Team ladder — only ${mode} matches count`}
        </div>

        <div className="space-y-2">
          {entries.length > 0 ? (
            entries.map((entry, i) => {
              const isPlayer = entry.entity_type === "player"
              const profile = profilesMap[entry.entity_id]
              const team = teamsMap[entry.entity_id]
              const name = isPlayer
                ? profile?.steam_name || "Unknown"
                : team
                ? `${team.tag ? `[${team.tag}] ` : ""}${team.name}`
                : "Unknown Team"
              const net = (entry.wins || 0) - (entry.losses || 0)

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    i === 0
                      ? "border-yellow-500/40 bg-yellow-500/5"
                      : i === 1
                      ? "border-gray-400/30 bg-gray-400/5"
                      : i === 2
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-[#1c1c28] bg-[#111118]"
                  }`}
                >
                  <div
                    className={`w-8 text-center font-black text-lg ${
                      i === 0
                        ? "text-yellow-400"
                        : i === 1
                        ? "text-gray-300"
                        : i === 2
                        ? "text-orange-400"
                        : "text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>

                  {isPlayer && profile?.avatar_url && (
                    <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-gray-500">
                      {isPlayer ? "Player" : `${mode} Team`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">
                      <span className="text-emerald-400">{entry.wins}W</span>{" "}
                      <span className="text-red-400">{entry.losses}L</span>
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        net > 0 ? "text-emerald-400" : net < 0 ? "text-red-400" : "text-gray-500"
                      }`}
                    >
                      {net > 0 ? `+${net}` : net}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 text-gray-500">
              No entries yet this month for {mode}.
              <div className="mt-2 text-sm">Play matches to appear on the ladder.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}