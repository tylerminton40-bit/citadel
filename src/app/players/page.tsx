import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { getRank } from "@/lib/ranks"
import PlayersClient from "@/components/PlayersClient"

export default async function PlayersPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .order("xp", { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to Hub
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Players</h1>
        <p className="text-gray-400 text-sm mb-6 sm:mb-8">Search and view Citadel profiles</p>
        <PlayersClient initialPlayers={players || []} />
      </main>
    </div>
  )
}