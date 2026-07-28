import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getRank, getNextRank } from "@/lib/ranks"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/profile")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/profile")

  const xp = profile.xp || 0
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank
    ? Math.min(100, ((xp - rank.xp) / (nextRank.xp - rank.xp)) * 100)
    : 100

  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, team:teams(id, name, tag, size, wins, losses, is_scrim, avatar_url)")
    .eq("profile_id", profile.id)

  type TeamRow = {
    role: string
    team: {
      id: string
      name: string
      tag: string | null
      size: number
      wins: number
      losses: number
      is_scrim: boolean
      avatar_url: string | null
    } | null
  }

  const teams = ((memberships || []) as unknown as TeamRow[])
    .map((m) => {
      const t = Array.isArray(m.team) ? m.team[0] : m.team
      return t ? { role: m.role, team: t } : null
    })
    .filter(Boolean) as { role: string; team: NonNullable<TeamRow["team"]> }[]

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className={`bg-[#111118] border ${rank.border} rounded-2xl p-8 text-center mb-6`}>
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-28 h-28 rounded-full mx-auto mb-5 border-4 border-[#FF5C00]"
            />
          )}

          <h1 className="text-3xl font-bold mb-2">{profile.steam_name}</h1>

          <div
            className={`inline-block px-4 py-1.5 rounded-full ${rank.bg} ${rank.color} font-bold text-sm mb-8`}
          >
            {rank.name}
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextRank ? `${nextRank.xp.toLocaleString()} XP` : "Max Rank"}</span>
            </div>
            <div className="h-3 bg-[#1c1c28] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            {nextRank && (
              <p className="text-xs text-gray-500 mt-2">
                {nextRank.xp - xp} XP until {nextRank.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#FF5C00]">{xp}</div>
              <div className="text-xs text-gray-400">XP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{profile.wins || 0}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{profile.losses || 0}</div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Teams</h2>
            <Link href="/teams" className="text-xs text-[#FF5C00] hover:underline">
              Manage →
            </Link>
          </div>

          {teams.length === 0 ? (
            <p className="text-sm text-gray-500">Not on a team yet.</p>
          ) : (
            <div className="space-y-3">
              {teams.map(({ role, team }) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#08080d]"
                >
                  {team.avatar_url ? (
                    <img
                      src={team.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#1c1c28] flex items-center justify-center text-[#FF5C00] font-bold">
                      {(team.tag || team.name)[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">
                      {team.tag ? `[${team.tag}] ` : ""}
                      {team.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {team.is_scrim ? "Scrim" : "Normal"} · {team.size}v{team.size} · {role}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-emerald-400">{team.wins || 0}W</span>
                    {" / "}
                    <span className="text-red-400">{team.losses || 0}L</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}