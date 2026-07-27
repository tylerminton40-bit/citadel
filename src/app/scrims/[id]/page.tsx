import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { cancelScrim, acceptScrim } from "../actions"

type TeamInfo = {
  id: string
  name: string
  tag: string | null
  avatar_url: string | null
  wins: number
  losses: number
  is_scrim?: boolean
}

export default async function ScrimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/scrims")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/scrims")

  const { data: scrim } = await supabase
    .from("scrims")
    .select(`
      *,
      creator_team:teams!scrims_creator_team_id_fkey(*),
      opponent_team:teams!scrims_opponent_team_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  if (!scrim) {
    return (
      <div className="min-h-screen bg-[#08080d] text-gray-200">
        <Navbar />
        <div className="text-center py-32 text-gray-500">Scrim not found</div>
      </div>
    )
  }

  const creatorTeam = scrim.creator_team as TeamInfo | null
  const opponentTeam = scrim.opponent_team as TeamInfo | null
  const isCreator = profile.id === scrim.creator_id
  const isOpen = scrim.status === "open"
  const isAccepted = scrim.status === "accepted"

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)

  const myScrimTeams = (memberships || [])
    .map((m) => {
      const t = Array.isArray(m.team) ? m.team[0] : m.team
      return t as TeamInfo | null
    })
    .filter((t): t is TeamInfo => !!t && t.is_scrim === true && t.id !== scrim.creator_team_id)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/scrims" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Scrim Hub
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">Scrim</h1>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              isOpen
                ? "bg-yellow-500/15 text-yellow-400"
                : isAccepted
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-gray-500/15 text-gray-400"
            }`}
          >
            {scrim.status}
          </span>
        </div>

        {/* Teams VS */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-3xl p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center">
              {creatorTeam?.avatar_url ? (
                <img
                  src={creatorTeam.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#1c1c28] mx-auto mb-2 flex items-center justify-center text-[#FF5C00] font-bold text-xl">
                  {(creatorTeam?.tag || "A")[0]}
                </div>
              )}
              <div className="font-bold text-sm sm:text-base">
                {creatorTeam?.tag ? `[${creatorTeam.tag}] ` : ""}
                {creatorTeam?.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {creatorTeam?.wins || 0}W / {creatorTeam?.losses || 0}L
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black text-[#FF5C00]">VS</div>
              <div className="text-[10px] text-gray-500 mt-1">6v6 Scrim</div>
            </div>

            <div className="text-center">
              {opponentTeam ? (
                <>
                  {opponentTeam.avatar_url ? (
                    <img
                      src={opponentTeam.avatar_url}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c28] mx-auto mb-2 flex items-center justify-center text-purple-400 font-bold text-xl">
                      {(opponentTeam.tag || "B")[0]}
                    </div>
                  )}
                  <div className="font-bold text-sm sm:text-base">
                    {opponentTeam.tag ? `[${opponentTeam.tag}] ` : ""}
                    {opponentTeam.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {opponentTeam.wins || 0}W / {opponentTeam.losses || 0}L
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 mx-auto mb-2 flex items-center justify-center text-gray-500 text-xs">
                    ?
                  </div>
                  <div className="font-bold text-sm text-gray-500">Waiting</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 mb-6 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Visibility</span>
            <span>{scrim.visibility === "private" ? "Invite only" : "Open"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Schedule</span>
            <span>
              {scrim.scheduled_at
                ? new Date(scrim.scheduled_at).toLocaleString()
                : "ASAP"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">XP</span>
            <span>
              <span className="text-emerald-400">+60</span> win ·{" "}
              <span className="text-red-400">−40</span> loss
            </span>
          </div>
        </div>

        {isAccepted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 text-sm text-emerald-300">
            Scrim accepted. Talk window + live draft come in the next update.
            {scrim.talk_ends_at && (
              <div className="text-xs text-emerald-400/70 mt-1">
                Talk ends ~ {new Date(scrim.talk_ends_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isOpen && isCreator && (
            <form action={cancelScrim.bind(null, id)}>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm"
              >
                Cancel Scrim
              </button>
            </form>
          )}

          {isOpen && !isCreator && myScrimTeams.length > 0 && (
            <form action={acceptScrim.bind(null, id)} className="w-full sm:w-auto space-y-3">
              <select
                name="team_id"
                required
                className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm"
              >
                {myScrimTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tag ? `[${t.tag}] ` : ""}
                    {t.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm">
                Accept Scrim
              </button>
            </form>
          )}

          {isOpen && !isCreator && myScrimTeams.length === 0 && (
            <div className="text-sm text-gray-500 text-center">
              Need a Scrim team to accept.{" "}
              <Link href="/teams/create" className="text-[#FF5C00] hover:underline">
                Create one
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}