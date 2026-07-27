import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { createScrim } from "../actions"

type TeamRow = {
  id: string
  name: string
  tag: string | null
  is_scrim?: boolean
  size?: number
}

export default async function CreateScrimPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/scrims/create")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/scrims/create")

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)

  const scrimTeams = (memberships || [])
    .map((m) => {
      const t = Array.isArray(m.team) ? m.team[0] : m.team
      return t as TeamRow | null
    })
    .filter((t): t is TeamRow => !!t && t.is_scrim === true)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/scrims" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Scrim Hub
        </Link>
        <h1 className="text-3xl font-bold mb-2">Post Scrim</h1>
        <p className="text-gray-400 text-sm mb-8">
          Open or private · optional schedule · live draft after accept
        </p>

        {scrimTeams.length === 0 ? (
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-4">
              You need a team marked <strong className="text-white">Scrim</strong> on the Teams page.
            </p>
            <Link href="/teams/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-block">
              Create Scrim Team
            </Link>
          </div>
        ) : (
          <form action={createScrim} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your scrim team</label>
              <select
                name="team_id"
                required
                className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
              >
                {scrimTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tag ? `[${t.tag}] ` : ""}
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Visibility</label>
              <select
                name="visibility"
                className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
              >
                <option value="open">Open — any scrim team can accept</option>
                <option value="private">Private — invite only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Schedule (optional)</label>
              <input
                type="datetime-local"
                name="scheduled_at"
                className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank for ASAP</p>
            </div>

            <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
              Post Scrim
            </button>
          </form>
        )}
      </main>
    </div>
  )
}