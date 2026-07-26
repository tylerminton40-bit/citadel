import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { createMatch } from "./actions"

export default async function CreateMatchPage() {
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

  // User's teams by size
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(id, name, tag, size)")
    .eq("profile_id", profile.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams = (memberships || []).map((m: any) => m.team).filter(Boolean)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Create XP Match</h1>

        <form action={createMatch} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select name="ruleset" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              <option value="Street Brawl">Street Brawl</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Format</label>
            <select name="format" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              <option value="1v1">1v1 (solo)</option>
              <option value="2v2">2v2 (team required)</option>
              <option value="3v3">3v3 (team required)</option>
              <option value="4v4">4v4 (team required)</option>
              <option value="6v6">6v6 (team required)</option>
            </select>
          </div>

          {teams.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Team (required for 2v2–6v6)</label>
              <select name="team_id" className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
                <option value="">None (1v1 only)</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.tag ? `[${t.tag}] ` : ""}{t.name} ({t.size}v{t.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Best Of</label>
            <select name="best_of" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              <option value="Bo1">Best of 1</option>
              <option value="Bo3">Best of 3</option>
              <option value="Bo5">Best of 5</option>
              <option value="Bo7">Best of 7</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Region</label>
            <select name="region" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              <option value="NA East">NA East</option>
              <option value="NA West">NA West</option>
              <option value="EU">EU</option>
              <option value="Asia">Asia</option>
              <option value="SA">South America</option>
              <option value="OCE">Oceania</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Post Match
          </button>
        </form>
      </main>
    </div>
  )
}