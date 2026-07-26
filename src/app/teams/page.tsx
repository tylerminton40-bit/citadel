import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { acceptInvite, declineInvite, leaveTeam } from "./actions"

export default async function TeamsPage() {
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

  if (!profile) redirect("/")

  // All team memberships
  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, team:teams(*)")
    .eq("profile_id", profile.id)

  // Pending invites
  const { data: invites } = await supabase
    .from("team_invites")
    .select("*, team:teams(*, owner:profiles!teams_owner_id_fkey(steam_name)), inviter:profiles!team_invites_inviter_id_fkey(steam_name)")
    .eq("invitee_id", profile.id)
    .eq("status", "pending")

  // Members for each team
  const teamIds = memberships?.map((m: { team_id: string }) => m.team_id) || []
  const allMembers: Record<string, unknown[]> = {}
  if (teamIds.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("*, profile:profiles(id, steam_name, avatar_url, xp)")
      .in("team_id", teamIds)

    if (members) {
      for (const m of members) {
        if (!allMembers[m.team_id]) allMembers[m.team_id] = []
        allMembers[m.team_id].push(m)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-gray-400 text-sm mt-1">One team per mode. Required for 2v2–6v6.</p>
          </div>
          <Link href="/teams/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
            + Create Team
          </Link>
        </div>

        {/* Pending invites */}
        {invites && invites.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="font-bold text-[#FF5C00]">Pending Invites</h2>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {invites.map((inv: any) => (
              <div key={inv.id} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {inv.team?.name}{" "}
                    <span className="text-gray-500 text-sm">({inv.team?.size}v{inv.team?.size})</span>
                  </div>
                  <div className="text-sm text-gray-400">Invited by {inv.inviter?.steam_name}</div>
                </div>
                <div className="flex gap-2">
                  <form action={acceptInvite.bind(null, inv.id)}>
                    <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm">Accept</button>
                  </form>
                  <form action={declineInvite.bind(null, inv.id)}>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm border border-[#1c1c28] text-gray-400">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All your teams */}
        {memberships && memberships.length > 0 ? (
          <div className="space-y-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {memberships.map((mem: any) => {
              const team = mem.team
              const isOwner = mem.role === "owner"
              const members = allMembers[team.id] || []

              return (
                <div key={team.id} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {team.tag ? `[${team.tag}] ` : ""}{team.name}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span>{team.size}v{team.size}</span>
                        <span className="text-emerald-400">{team.wins || 0}W</span>
                        <span className="text-red-400">{team.losses || 0}L</span>
                      </div>
                    </div>
                    {isOwner && (
                      <Link href={`/teams/${team.id}/invite`} className="btn-primary px-4 py-2 rounded-xl text-sm shrink-0">
                        Invite
                      </Link>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold mb-3 text-sm text-gray-400">
                      Members ({members.length}/{team.size})
                    </h3>
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#08080d]">
                          {m.profile?.avatar_url && (
                            <img src={m.profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{m.profile?.steam_name}</div>
                            <div className="text-xs text-gray-500">{m.role}</div>
                          </div>
                          <span className="text-xs text-gray-500">{m.profile?.xp || 0} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form action={leaveTeam.bind(null, team.id)}>
                    <button type="submit" className="text-sm text-red-400 hover:text-red-300 transition">
                      {isOwner ? "Disband Team" : "Leave Team"}
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            You’re not on any teams yet.
            <div className="mt-4">
              <Link href="/teams/create" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">
                Create a Team
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}