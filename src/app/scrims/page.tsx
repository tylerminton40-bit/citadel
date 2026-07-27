import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import ScrimList from "@/components/ScrimList"

export default async function ScrimsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const currentTab = tab || "open"

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/scrims")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/scrims")

  // User's scrim teams
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrimTeams = (memberships || [])
    .map((m: any) => m.team)
    .filter((t: any) => t && t.is_scrim)

  let initialScrims: unknown[] = []
  if (currentTab === "open") {
    const { data } = await supabase
      .from("scrims")
      .select(`
        *,
        creator_team:teams!scrims_creator_team_id_fkey(id, name, tag, avatar_url, wins, losses),
        opponent_team:teams!scrims_opponent_team_id_fkey(id, name, tag, avatar_url)
      `)
      .eq("status", "open")
      .eq("visibility", "open")
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(40)
    initialScrims = data || []
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Scrims</h1>
            <p className="text-gray-400 text-sm mt-1">
              Team practice · live draft · +60 / −40 XP · monthly Apex
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/scrims/teams/create"
              className="px-4 py-2.5 rounded-xl text-sm border border-[#1c1c28] hover:border-[#FF5C00]/50 transition"
            >
              Scrim Team
            </Link>
            <Link
              href="/scrims/create"
              className="btn-primary px-4 py-2.5 rounded-xl text-sm"
            >
              + Post Scrim
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: "open", label: "Open Scrims" },
            { id: "yours", label: "Your Scrims" },
            { id: "drafts", label: "Draft Only" },
            { id: "ladder", label: "Scrim Ladder" },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/scrims?tab=${t.id}`}
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

        {currentTab === "ladder" ? (
          <div className="text-center py-16 text-gray-500">
            Scrim ladder + top 16 → <span className="text-[#FF5C00] font-medium">Citadel Apex</span>
            <div className="text-xs mt-2">Activates when scrims start completing</div>
          </div>
        ) : currentTab === "drafts" ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No-record drafts · does not affect ladder</p>
            <Link href="/scrims/draft-only" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">
              Start Draft Only
            </Link>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ScrimList initialScrims={initialScrims as any} currentTab={currentTab} />
        )}

        {scrimTeams.length === 0 && (
          <div className="mt-10 p-5 rounded-2xl border border-[#1c1c28] bg-[#111118] text-sm text-gray-400">
            You need a <strong className="text-white">Scrim Team</strong> (6v6) to post or accept scrims.{" "}
            <Link href="/scrims/teams/create" className="text-[#FF5C00] hover:underline">
              Create one →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}