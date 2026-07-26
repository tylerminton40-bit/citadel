import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { createTeam } from "../actions"

export default async function CreateTeamPage() {
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

  // Already on a team?
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("profile_id", profile.id)
    .limit(1)

  if (existing && existing.length > 0) {
    redirect("/teams?error=already_on_team")
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Create Team</h1>
        <p className="text-gray-400 text-sm mb-8">You can only be on one team at a time.</p>

        <form action={createTeam} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Team Name</label>
            <input
              name="name"
              required
              maxLength={32}
              placeholder="e.g. Citadel Elite"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tag (optional)</label>
            <input
              name="tag"
              maxLength={5}
              placeholder="e.g. CTD"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Team Size</label>
            <select name="size" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              <option value="2">2v2</option>
              <option value="3">3v3</option>
              <option value="4">4v4</option>
              <option value="6">6v6</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Create Team
          </button>
        </form>
      </main>
    </div>
  )
}