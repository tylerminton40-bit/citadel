import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { cancelScrim, acceptScrim } from "../actions"
import ScrimLive from "@/components/ScrimLive"

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
  
    let creatorMembers: { steam_name: string; avatar_url: string | null; role: string }[] = []
  if (scrim.creator_team_id) {
    const { data } = await supabase
      .from("team_members")
      .select("role, profile:profiles(steam_name, avatar_url)")
      .eq("team_id", scrim.creator_team_id)
    creatorMembers = (data || []).map((row) => {
      const p = Array.isArray(row.profile) ? row.profile[0] : row.profile
      return {
        role: row.role,
        steam_name: p?.steam_name || "?",
        avatar_url: p?.avatar_url || null,
      }
    })
  }

  const creatorTeam = scrim.creator_team as TeamInfo | null
  const opponentTeam = scrim.opponent_team as TeamInfo | null
  const isCreator = profile.id === scrim.creator_id
  const isOpen = scrim.status === "open"
  const isAccepted = scrim.status === "accepted"
  const isChoosing = scrim.status === "choosing"
  const isDrafting = scrim.status === "drafting"
  const isLive = scrim.status === "live"

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)

  const myScrimTeams = (memberships || [])
    .map((m) => {
      const t = Array.isArray(m.team) ? m.team[0] : m.team
      return t as TeamInfo | null
    })
    .filter(
      (t): t is TeamInfo =>
        !!t && t.is_scrim === true && t.id !== scrim.creator_team_id
    )

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/scrims"
          className="text-sm text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Scrim Hub
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">Scrim</h1>
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#FF5C00]/15 text-[#FF5C00]">
            {scrim.status}
          </span>
        </div>

        {/* VS header */}
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
              <div className="font-bold text-sm">
                {creatorTeam?.tag ? `[${creatorTeam.tag}] ` : ""}
                {creatorTeam?.name}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black text-[#FF5C00]">VS</div>
              <div className="text-[10px] text-gray-500">6v6 · +60/−40</div>
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
                  <div className="font-bold text-sm">
                    {opponentTeam.tag ? `[${opponentTeam.tag}] ` : ""}
                    {opponentTeam.name}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 mx-auto mb-2" />
                  <div className="font-bold text-sm text-gray-500">Waiting</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* OPEN — cancel / accept only */}
        {isOpen && isCreator && (
          <form action={cancelScrim.bind(null, id)} className="mb-6 text-center">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm"
            >
              Cancel Scrim
            </button>
          </form>
        )}
		
		{isOpen && creatorMembers.length > 0 && (
  <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 mb-6">
    <h3 className="text-sm font-bold text-gray-400 mb-3">
      {creatorTeam?.name} roster
    </h3>
    <div className="space-y-2">
      {creatorMembers.map((m, i) => (
        <div key={i} className="flex items-center gap-3">
          {m.avatar_url ? (
            <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1c1c28]" />
          )}
          <div className="text-sm flex-1">{m.steam_name}</div>
          <div className="text-xs text-gray-500">{m.role}</div>
        </div>
      ))}
    </div>
  </div>
)}

        {isOpen && !isCreator && myScrimTeams.length > 0 && (
          <form
            action={acceptScrim.bind(null, id)}
            className="mb-6 space-y-3 max-w-sm mx-auto"
          >
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
            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-xl text-sm"
            >
              Accept Scrim
            </button>
          </form>
        )}

        {isOpen && !isCreator && myScrimTeams.length === 0 && (
          <div className="text-sm text-gray-500 text-center mb-6">
            Need a Scrim team to accept.{" "}
            <Link href="/teams/create" className="text-[#FF5C00] hover:underline">
              Create one
            </Link>
          </div>
        )}

        {/* LIVE block — talk, ready, choose, draft (no refresh) */}
        {(isAccepted || isChoosing || isDrafting || isLive) && opponentTeam && (
          <ScrimLive
            scrimId={id}
            profileId={profile.id}
            creatorName={creatorTeam?.name || "Host team"}
            opponentName={opponentTeam?.name || "Challenger"}
            initial={{
              id: scrim.id,
              status: scrim.status,
              talk_ends_at: scrim.talk_ends_at,
              creator_ready: !!scrim.creator_ready,
              opponent_ready: !!scrim.opponent_ready,
              host_team_id: scrim.host_team_id,
              first_ban_team_id: scrim.first_ban_team_id,
              draft_state: scrim.draft_state,
              creator_team_id: scrim.creator_team_id,
              opponent_team_id: scrim.opponent_team_id,
              creator_id: scrim.creator_id,
              opponent_captain_id: scrim.opponent_captain_id,
            }}
          />
        )}
      </main>
    </div>
  )
}