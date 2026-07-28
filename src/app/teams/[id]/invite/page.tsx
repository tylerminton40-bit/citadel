import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import InviteSearch from "@/components/InviteSearch"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .single()

  if (!team) redirect("/teams")

  // Block: self, same-size team members, pending invites, current members
  const blockedIds = new Set<string>([profile.id])

  const { data: sameSizeMembers } = await supabase
    .from("team_members")
    .select("profile_id, team:teams(size)")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sameSizeMembers?.forEach((m: any) => {
    const t = Array.isArray(m.team) ? m.team[0] : m.team
    if (t?.size === team.size) blockedIds.add(m.profile_id)
  })

  const { data: pending } = await supabase
    .from("team_invites")
    .select("invitee_id")
    .eq("team_id", id)
    .eq("status", "pending")

  pending?.forEach((p) => blockedIds.add(p.invitee_id))

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
        <Link href="/teams" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to Teams
        </Link>
        <h1 className="text-3xl font-bold mb-2">Invite to {team.name}</h1>
        <p className="text-gray-400 text-sm mb-8">
          Search by Steam name, then send invite
        </p>

        <InviteSearch teamId={id} players={available} />
      </main>
    </div>
  )
}