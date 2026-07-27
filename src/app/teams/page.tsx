import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { acceptInvite, declineInvite, leaveTeam, kickMember } from "./actions"
import { disbandTeam } from "./actions"

type ProfileMini = {
  id: string
  steam_name: string
  avatar_url: string | null
  xp: number
}

type Team = {
  id: string
  name: string
  tag: string | null
  size: number
  wins: number
  losses: number
  owner_id: string
  avatar_url: string | null
  is_scrim: boolean
}

type Member = {
  id: string
  role: string
  profile: ProfileMini | null
}

type Invite = {
  id: string
  team: Team | null
  inviter: { steam_name: string } | null
}

export default async function TeamsPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/teams")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/teams")

  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, team:teams(*)")
    .eq("profile_id", profile.id)

  const { data: invites } = await supabase
    .from("team_invites")
    .select("*, team:teams(*), inviter:profiles!team_invites_inviter_id_fkey(steam_name)")
    .eq("invitee_id", profile.id)
    .eq("status", "pending")

  const teams: { membershipId: string; role: string; team: Team }[] = []
  for (const m of memberships || []) {
    const team = Array.isArray(m.team) ? m.team[0] : m.team
    if (team) {
      teams.push({
        membershipId: m.id,
        role: m.role,
        team: team as Team,
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-gray-400 text-sm mt-1">
              One normal + one scrim team per size
            </p>
          </div>
          <Link href="/teams/create" className="btn-primary px-4 py-2.5 rounded-xl text-sm shrink-0">
            + Create
          </Link>
        </div>

        {/* Pending invites — always visible */}
        {invites && invites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Pending Invites
            </h2>
            <div className="space-y-3">
              {(invites as Invite[]).map((inv) => (
                <div
                  key={inv.id}
                  className="bg-[#111118] border border-[#FF5C00]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium">
                      {inv.team?.tag ? `[${inv.team.tag}] ` : ""}
                      {inv.team?.name || "Team"}
                    </div>
                    <div className="text-xs text-gray-500">
                      From {inv.inviter?.steam_name || "someone"}
                      {inv.team?.is_scrim ? " · Scrim" : ` · ${inv.team?.size}v${inv.team?.size}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={acceptInvite.bind(null, inv.id)}>
                      <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm">
                        Accept
                      </button>
                    </form>
                    <form action={declineInvite.bind(null, inv.id)}>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-sm border border-[#1c1c28] hover:border-red-500/40 text-gray-400"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="mb-4">You’re not on a team yet.</p>
            <Link href="/teams/create" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">
              Create Team
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {await Promise.all(
              teams.map(async ({ role, team }) => {
                const isOwner = team.owner_id === profile.id || role === "owner"

                const { data: memberRows } = await supabase
                  .from("team_members")
                  .select("id, role, profile:profiles(id, steam_name, avatar_url, xp)")
                  .eq("team_id", team.id)

                const members = (memberRows as unknown as Member[]) || []
                const wins = team.wins || 0
                const losses = team.losses || 0
                const games = wins + losses
                const winPct = games > 0 ? Math.round((wins / games) * 100) : 0

                return (
                  <div
                    key={team.id}
                    className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4 mb-5">
                      {team.avatar_url ? (
                        <img
                          src={team.avatar_url}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF5C00]/40 to-[#1c1c28] flex items-center justify-center text-[#FF5C00] font-black text-xl shrink-0">
                          {(team.tag || team.name)[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg truncate">
                            {team.tag ? `[${team.tag}] ` : ""}
                            {team.name}
                          </span>
                          {team.is_scrim ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/15 text-[#FF5C00] font-bold uppercase tracking-wide">
                              Scrim
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 font-bold uppercase tracking-wide">
                              Normal
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c28] text-gray-400 font-medium">
                            {team.size}v{team.size}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="text-emerald-400">{wins}W</span>
                          {" / "}
                          <span className="text-red-400">{losses}L</span>
                          {games > 0 && (
                            <span className="text-gray-600"> · {winPct}% win rate</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Members
                    </h3>
                    <div className="space-y-2 mb-4">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#08080d]"
                        >
                          {m.profile?.avatar_url ? (
                            <img
                              src={m.profile.avatar_url}
                              alt=""
                              className="w-9 h-9 rounded-full"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#1c1c28]" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {m.profile?.steam_name}
                            </div>
                            <div className="text-xs text-gray-500">{m.role}</div>
                          </div>
                          <span className="text-xs text-gray-500 mr-2">
                            {m.profile?.xp || 0} XP
                          </span>
                          {isOwner && m.role !== "owner" && m.profile?.id && (
                            <form action={kickMember.bind(null, team.id, m.profile.id)}>
                              <button
                                type="submit"
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Kick
                              </button>
                            </form>
                          )}
						  
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isOwner && (
                        <Link
                          href={`/teams/${team.id}/invite`}
                          className="px-4 py-2 rounded-xl text-sm border border-[#1c1c28] hover:border-[#FF5C00]/50 transition"
                        >
                          Invite
                        </Link>
                      )}
					  {isOwner && (
  <form action={disbandTeam.bind(null, team.id)}>
    <button
      type="submit"
      className="px-4 py-2 rounded-xl text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
    >
      Disband Team
    </button>
  </form>
)}
                      {!isOwner && (
                        <form action={leaveTeam.bind(null, team.id)}>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                          >
                            Leave
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}