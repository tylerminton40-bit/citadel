import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import CreateMatchForm from "@/components/CreateMatchForm"

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
        <CreateMatchForm teams={teams} />
      </main>
    </div>
  )
}