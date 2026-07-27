import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import ScrimList from "@/components/ScrimList"

type TeamRow = {
  id: string
  name: string
  tag: string | null
  avatar_url: string | null
  is_scrim?: boolean
  size?: number
  wins?: number
  losses?: number
}

type MembershipRow = {
  team: TeamRow | TeamRow[] | null
}

type MemberRow = {
  role: string
  profile: {
    id: string
    steam_name: string
    avatar_url: string | null
    xp: number
  } | null
}

export default async function ScrimsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; team?: string }>
}) {
  const { tab, team: teamParam } = await searchParams
  const currentTab = tab || "hub"

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

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)

  const scrimTeams = ((memberships || []) as MembershipRow[])
    .map((m) => (Array.isArray(m.team) ? m.team[0] : m.team))
    .filter((t): t is TeamRow => !!t && t.is_scrim === true)

  const mainTeam =
    scrimTeams.find((t) => t.id === teamParam) || scrimTeams[0] || null

  let members: MemberRow[] = []
  if (mainTeam) {
    const { data } = await supabase
      .from("team_members")
      .select("role, profile:profiles(id, steam_name, avatar_url, xp)")
      .eq("team_id", mainTeam.id)
    members = (data as unknown as MemberRow[]) || []
  }

  const { data: openScrims } = await supabase
    .from("scrims")
    .select(`
      *,
      creator_team:teams!scrims_creator_team_id_fkey(id, name, tag, avatar_url, wins, losses),
      opponent_team:teams!scrims_opponent_team_id_fkey(id, name, tag, avatar_url)
    `)
    .eq("status", "open")
    .eq("visibility", "open")
    .order("created_at", { ascending: false })
    .limit(20)

  let yourScrims: unknown[] = []
  {
    const { data: allMemberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", profile.id)
    const teamIds = (allMemberships || []).map((m) => m.team_id)
    if (teamIds.length > 0) {
      const { data } = await supabase
        .from("scrims")
        .select(`
          *,
          creator_team:teams!scrims_creator_team_id_fkey(id, name, tag, avatar_url, wins, losses),
          opponent_team:teams!scrims_opponent_team_id_fkey(id, name, tag, avatar_url)
        `)
        .or(
          teamIds
            .map((tid) => `creator_team_id.eq.${tid},opponent_team_id.eq.${tid}`)
            .join(",")
        )
        .in("status", [
          "open",
          "accepted",
          "choosing",
          "drafting",
          "live",
          "completed",
          "disputed",
        ])
        .order("created_at", { ascending: false })
        .limit(40)
      yourScrims = data || []
    }
  }

  const wins = mainTeam?.wins || 0
  const losses = mainTeam?.losses || 0
  const games = wins + losses
  const winPct = games > 0 ? Math.round((wins / games) * 100) : 0

  const teamIndex = mainTeam
    ? Math.max(0, scrimTeams.findIndex((t) => t.id === mainTeam.id))
    : 0
  const prevTeam =
    scrimTeams.length > 1
      ? scrimTeams[(teamIndex - 1 + scrimTeams.length) % scrimTeams.length]
      : null
  const nextTeam =
    scrimTeams.length > 1
      ? scrimTeams[(teamIndex + 1) % scrimTeams.length]
      : null

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-[10px] font-bold tracking-widest uppercase mb-3">
              Live draft · +60 / −40 XP
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Scrim Hub</h1>
            <p className="text-gray-400 text-sm mt-1">
              Practice, draft, climb · Top 16 → Citadel Apex
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/teams/create"
              className="px-4 py-2.5 rounded-xl text-sm border border-[#1c1c28] hover:border-[#FF5C00]/50 transition"
            >
              Create Team
            </Link>
            <Link
              href="/scrims/create"
              className="btn-primary px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              + Post Scrim
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {[
            { id: "hub", label: "Hub" },
            { id: "open", label: "Open Scrims" },
            { id: "yours", label: "Your Scrims" },
            { id: "drafts", label: "Draft Only" },
            { id: "ladder", label: "Ladder" },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/scrims?tab=${t.id}${mainTeam ? `&team=${mainTeam.id}` : ""}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition ${
                currentTab === t.id
                  ? "bg-[#FF5C00] text-black"
                  : "bg-[#111118] text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {currentTab === "hub" && (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
              {mainTeam ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    {prevTeam && (
                      <Link
                        href={`/scrims?tab=hub&team=${prevTeam.id}`}
                        className="w-9 h-9 rounded-xl border border-[#1c1c28] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FF5C00]/50"
                      >
                        ←
                      </Link>
                    )}
                    <div className="flex-1 text-center text-xs text-gray-500">
                      {scrimTeams.length > 1
                        ? `Team ${teamIndex + 1} of ${scrimTeams.length}`
                        : "Your scrim team"}
                    </div>
                    {nextTeam && (
                      <Link
                        href={`/scrims?tab=hub&team=${nextTeam.id}`}
                        className="w-9 h-9 rounded-xl border border-[#1c1c28] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FF5C00]/50"
                      >
                        →
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    {mainTeam.avatar_url ? (
                      <img
                        src={mainTeam.avatar_url}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover border border-[#1c1c28]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] flex items-center justify-center text-black text-2xl font-black">
                        {(mainTeam.tag || mainTeam.name)[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xl font-bold truncate">
                        {mainTeam.tag ? `[${mainTeam.tag}] ` : ""}
                        {mainTeam.name}
                      </div>
                      <div className="text-xs text-[#FF5C00] font-medium mt-0.5">
                        Scrim Team · 6v6
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#08080d] rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-emerald-400">{wins}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Wins</div>
                    </div>
                    <div className="bg-[#08080d] rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-red-400">{losses}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Losses</div>
                    </div>
                    <div className="bg-[#08080d] rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-[#FF5C00]">{winPct}%</div>
                      <div className="text-[10px] text-gray-500 uppercase">Win rate</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-400 mb-3">Roster</h3>
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#08080d]"
                      >
                        {m.profile?.avatar_url ? (
                          <img
                            src={m.profile.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1c1c28]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {m.profile?.steam_name}
                          </div>
                          <div className="text-[10px] text-gray-500">{m.role}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {m.profile?.xp || 0} XP
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="text-lg font-bold mb-2">No scrim team yet</div>
                  <p className="text-sm text-gray-400 mb-5">
                    Create a team on Teams and check{" "}
                    <strong className="text-white">Scrim team</strong>.
                  </p>
                  <Link
                    href="/teams/create"
                    className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block"
                  >
                    Create Team
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Link
                href="/scrims/create"
                className="block bg-gradient-to-br from-[#FF5C00]/20 to-[#FF8A00]/5 border border-[#FF5C00]/40 rounded-2xl p-5 hover:border-[#FF5C00] transition"
              >
                <div className="text-lg font-bold mb-1">Post a Scrim</div>
                <div className="text-xs text-gray-400">Open or private · schedule · live draft</div>
              </Link>
              <Link
                href="/scrims?tab=open"
                className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 hover:border-[#FF5C00]/40 transition"
              >
                <div className="text-lg font-bold mb-1">Find Scrims</div>
                <div className="text-xs text-gray-400">Open challenges from other teams</div>
              </Link>
              <Link
                href="/scrims?tab=yours"
                className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 hover:border-[#FF5C00]/40 transition"
              >
                <div className="text-lg font-bold mb-1">Your Scrims</div>
                <div className="text-xs text-gray-400">All phases · whole team can open</div>
              </Link>
              <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Season finale
                </div>
                <div className="font-bold text-[#FF5C00]">Citadel Apex</div>
                <div className="text-xs text-gray-400 mt-1">Top 16 scrim teams each month</div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Open Scrims</h2>
                <Link href="/scrims?tab=open" className="text-xs text-[#FF5C00] hover:underline">
                  View all →
                </Link>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ScrimList initialScrims={(openScrims || []) as any} currentTab="open" />
            </div>
          </div>
        )}

        {currentTab === "open" && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ScrimList initialScrims={(openScrims || []) as any} currentTab="open" />
        )}

        {currentTab === "yours" && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ScrimList initialScrims={yourScrims as any} currentTab="yours" />
        )}

        {currentTab === "drafts" && (
          <div className="text-center py-16 text-gray-500">
            Draft Only — coming next after report/XP
          </div>
        )}

        {currentTab === "ladder" && (
          <div className="text-center py-16 text-gray-500">
            Scrim ladder · Top 16 →{" "}
            <span className="text-[#FF5C00] font-medium">Citadel Apex</span>
          </div>
        )}
      </main>
    </div>
  )
}