import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import {
  cancelScrim,
  acceptScrim,
  setCaptainReady,
  chooseHostOrFirstBan,
} from "../actions"
import ScrimLobby from "@/components/ScrimLobby"

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
  const isOpponentCaptain = profile.id === scrim.opponent_captain_id
  const isOpen = scrim.status === "open"
  const isAccepted = scrim.status === "accepted"
  const isChoosing = scrim.status === "choosing"
  const isDrafting = scrim.status === "drafting"

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
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#FF5C00]/15 text-[#FF5C00]">
            {scrim.status}
          </span>
        </div>

        {/* VS header */}
        <div className="bg-[#111118] border border-[#1c1c28] rounded-3xl p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center">
              {creatorTeam?.avatar_url ? (
                <img src={creatorTeam.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2" />
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
                    <img src={opponentTeam.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2" />
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

        {/* OPEN actions */}
        {isOpen && isCreator && (
          <form action={cancelScrim.bind(null, id)} className="mb-6 text-center">
            <button type="submit" className="px-8 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm">
              Cancel Scrim
            </button>
          </form>
        )}

        {isOpen && !isCreator && myScrimTeams.length > 0 && (
          <form action={acceptScrim.bind(null, id)} className="mb-6 space-y-3 max-w-sm mx-auto">
            <select name="team_id" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm">
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

        {/* ACCEPTED — talk + ready */}
        {isAccepted && (
          <ScrimLobby
            scrimId={id}
            talkEndsAt={scrim.talk_ends_at}
            creatorReady={!!scrim.creator_ready}
            opponentReady={!!scrim.opponent_ready}
            isCreator={isCreator}
            isOpponentCaptain={isOpponentCaptain}
            creatorName={creatorTeam?.name || "Host team"}
            opponentName={opponentTeam?.name || "Challenger"}
          />
        )}

        {/* CHOOSING — accepting captain picks host or first ban */}
        {isChoosing && (
          <div className="bg-[#111118] border border-[#FF5C00]/40 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-2">Side choice</h2>
            {isOpponentCaptain ? (
              <>
                <p className="text-sm text-gray-400 mb-5">
                  You accepted — choose <strong className="text-white">Host</strong> or{" "}
                  <strong className="text-white">First Ban</strong>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <form action={chooseHostOrFirstBan.bind(null, id)}>
                    <input type="hidden" name="choice" value="host" />
                    <button type="submit" className="w-full py-4 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/40 text-[#FF5C00] font-bold hover:bg-[#FF5C00]/25 transition">
                      Host
                    </button>
                  </form>
                  <form action={chooseHostOrFirstBan.bind(null, id)}>
                    <input type="hidden" name="choice" value="first_ban" />
                    <button type="submit" className="w-full py-4 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-500/25 transition">
                      First Ban
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Waiting for accepting captain to choose Host or First Ban…
              </p>
            )}
          </div>
        )}

        {/* DRAFTING placeholder */}
        {isDrafting && (
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 text-center">
            <div className="text-lg font-bold mb-2">Draft starting</div>
            <p className="text-sm text-gray-400">
              Live ban/pick board is the next batch. First ban team is set.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}