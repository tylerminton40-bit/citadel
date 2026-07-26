import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { invitePlayerById } from "../../actions"

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")

  // Players already on a team of this size
  const { data: sameSizeMembers } = await supabase
    .from("team_members")
    .select("profile_id, team:teams(size)")

  const blockedIds = new Set<string>([profile.id])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sameSizeMembers?.forEach((m: any) => {
    if (m.team?.size === team.size) blockedIds.add(m.profile_id)
  })

  // Already invited pending
  const { data: pending } = await supabase
    .from("team_invites")
    .select("invitee_id")
    .eq("team_id", id)
    .eq("status", "pending")

  pending?.forEach((p) => blockedIds.add(p.invitee_id))

  // Current team members
  const { data: currentMembers } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", id)

  currentMembers?.forEach((m) => blockedIds.add(m.profile_id))

  const { data: players } = await supabase
    .from("profiles")
    .select("id, steam_name, avatar_url, xp")
    .order("steam_name")
    .limit(500)

  const available = (players || []).filter((p) => !blockedIds.has(p.id))

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Invite to {team.name}</h1>
        <p className="text-gray-400 text-sm mb-8">Select a player from the list</p>

        <form action={invitePlayerById.bind(null, id)} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Player</label>
            {available.length > 0 ? (
              <select
                name="player_id"
                required
                className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
              >
                <option value="">Select player...</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.steam_name} ({p.xp} XP)
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 py-3">No available players to invite.</div>
            )}
          </div>

          <button
            type="submit"
            disabled={available.length === 0}
            className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-40"
          >
            Send Invite
          </button>
        </form>
      </main>
    </div>
  )
}