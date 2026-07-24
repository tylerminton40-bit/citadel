import Link from "next/link"
import Navbar from "@/components/Navbar"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export default async function Home() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  let profile = null
  if (steamId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.from("profiles").select("*").eq("steam_id", steamId).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-20 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></span>
          LIVE • Deadlock Competitive Platform
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          COMPETE FOR<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]">
            GLORY
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          The premier platform for Deadlock XP matches, exclusive ranks, and competitive ladders.
          Login with Steam. Climb the Citadel ranks. Prove yourself.
        </p>

        {profile ? (
          <Link href="/profile" className="btn-primary px-8 py-3.5 rounded-xl text-base inline-block glow-orange">
            Go to Profile
          </Link>
        ) : (
          <a href="/api/steam/login" className="btn-primary px-8 py-3.5 rounded-xl text-base inline-block glow-orange">
            Login with Steam
          </a>
        )}
      </section>

      {/* Features */}
      <section className="py-20 border-t border-[#1c1c28]">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-[#FF5C00] font-bold text-xl mb-2">XP Matches</div>
            <p className="text-gray-400 text-sm">Free competitive matches. Win or lose, you still earn XP and climb the ranks.</p>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-purple-400 font-bold text-xl mb-2">Exclusive Ranks</div>
            <p className="text-gray-400 text-sm">Our own ranking system from Ember to Eternal. Unique colors and prestige.</p>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-emerald-400 font-bold text-xl mb-2">Steam Verified</div>
            <p className="text-gray-400 text-sm">Login with Steam only. Your real name and avatar are always shown.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-[#1c1c28] text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to enter the Citadel?</h2>
        <p className="text-gray-400 mb-8">Join the competitive Deadlock community today.</p>
        {profile ? (
          <Link href="/ranks" className="btn-primary px-8 py-3 rounded-xl inline-block">
            View Ranks
          </Link>
        ) : (
          <a href="/api/steam/login" className="btn-primary px-8 py-3 rounded-xl inline-block">
            Login with Steam
          </a>
        )}
      </section>

      <footer className="border-t border-[#1c1c28] py-10 text-center text-sm text-gray-500">
        © 2026 Citadel. Not affiliated with Valve Corporation.
      </footer>
    </div>
  )
}