import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createTicket } from "./actions"

export default async function CreateTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ scrim?: string; match?: string }>
}) {
  const sp = await searchParams
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/tickets/create")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/tickets/create")

    const { data: existing } = await supabase
    .from("tickets")
    .select("id")
    .eq("creator_id", profile.id)
    .eq("status", "open")

  if ((existing?.length || 0) >= 5) {
    redirect("/tickets?error=already_open")
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, format, best_of, status, created_at, creator:profiles!matches_creator_id_fkey(steam_name), opponent:profiles!matches_opponent_id_fkey(steam_name)"
    )
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(20)

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", profile.id)

  const teamIds = (memberships || []).map((m) => m.team_id)

  type ScrimRow = {
    id: string
    status: string
    creator_team: { name: string; tag: string | null } | null
    opponent_team: { name: string; tag: string | null } | null
  }

  let scrims: ScrimRow[] = []

  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("scrims")
      .select(
        `id, status,
         creator_team:teams!scrims_creator_team_id_fkey(name, tag),
         opponent_team:teams!scrims_opponent_team_id_fkey(name, tag)`
      )
      .or(
        teamIds
          .map((tid) => `creator_team_id.eq.${tid},opponent_team_id.eq.${tid}`)
          .join(",")
      )
      .in("status", ["disputed", "live", "completed", "accepted", "drafting"])
      .order("created_at", { ascending: false })
      .limit(20)

    scrims = (data || []).map((s) => ({
      id: s.id,
      status: s.status,
      creator_team: Array.isArray(s.creator_team) ? s.creator_team[0] : s.creator_team,
      opponent_team: Array.isArray(s.opponent_team) ? s.opponent_team[0] : s.opponent_team,
    }))
  }

  // Single list: match:uuid or scrim:uuid
  const preselect = sp.scrim
    ? `scrim:${sp.scrim}`
    : sp.match
    ? `match:${sp.match}`
    : ""

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />
      <main className="max-w-xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold mb-2">New Ticket</h1>
        <p className="text-gray-400 text-sm mb-8">
          Pick a related match or scrim if this is a dispute. Upload at least 1 screenshot or video.
        </p>

        <form
          action={createTicket}
          className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-2">Related match or scrim</label>
            <select
              name="related"
              defaultValue={preselect}
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            >
              <option value="">None</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {matches?.map((m: any) => (
                <option key={`match-${m.id}`} value={`match:${m.id}`}>
                  MATCH · {m.format} {m.best_of} · {m.status} ·{" "}
                  {m.creator?.steam_name || "?"} vs {m.opponent?.steam_name || "?"}
                </option>
              ))}
              {scrims.map((s) => (
                <option key={`scrim-${s.id}`} value={`scrim:${s.id}`}>
                  SCRIM · {s.status} ·{" "}
                  {s.creator_team?.tag ? `[${s.creator_team.tag}] ` : ""}
                  {s.creator_team?.name || "?"} vs{" "}
                  {s.opponent_team?.tag ? `[${s.opponent_team.tag}] ` : ""}
                  {s.opponent_team?.name || "?"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <input
              name="subject"
              required
              placeholder="e.g. Scrim dispute — wrong winner reported"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes / Explanation</label>
            <textarea
              name="notes"
              rows={4}
              placeholder="Explain what happened..."
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Proof (Screenshot or Video) *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Max 50MB. Prefer PNG, JPG, or MP4.
            </p>
            <input
              name="proof"
              type="file"
              accept="image/*,video/*"
              required
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#FF5C00] file:text-black file:font-medium"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Submit Ticket
          </button>
        </form>
      </main>
    </div>
  )
}