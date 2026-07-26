import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { invitePlayer } from "../../actions"

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

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Invite to {team.name}</h1>
        <p className="text-gray-400 text-sm mb-8">Search by exact Steam name</p>

        <form action={invitePlayer.bind(null, id)} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Steam Name</label>
            <input
              name="steam_name"
              required
              placeholder="Exact Steam name"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Send Invite
          </button>
        </form>
      </main>
    </div>
  )
}