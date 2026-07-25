import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { getRank } from "@/lib/ranks"
import Notifications from "@/components/Notifications"

export default async function Navbar() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  let profile = null
  if (steamId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("steam_id", steamId)
      .single()
    profile = data
  }

  const rank = profile ? getRank(profile.xp || 0) : null

  return (
    <nav className="border-b border-[#1c1c28] bg-[#050508]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] flex items-center justify-center font-bold text-black text-sm">
            C
          </div>
          <span className="font-bold text-xl tracking-wide">CITADEL</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/ranks" className="text-sm text-gray-400 hover:text-white transition">
            Ranks
          </Link>
          <Link href="/matches" className="text-sm text-gray-400 hover:text-white transition">
            Match Finder
          </Link>
          <Link href="/tickets" className="text-sm text-gray-400 hover:text-white transition">
            Tickets
          </Link>
          <Link href="/rules" className="text-sm text-gray-400 hover:text-white transition">
            Rules
          </Link>

          {profile ? (
            <div className="flex items-center gap-3">
              <Notifications userId={profile.id} />
              
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                {profile.avatar_url && (
                  <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm font-medium">{profile.steam_name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${rank?.bg} ${rank?.color}`}>
                  {rank?.name}
                </span>
              </Link>

              <Link href="/settings" className="text-sm text-gray-400 hover:text-white">
                Settings
              </Link>
            </div>
          ) : (
            <a href="/api/steam/login" className="btn-primary px-5 py-2 rounded-lg text-sm">
              Login with Steam
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}