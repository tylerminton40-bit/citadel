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
      <section className="relative pt-28 pb-24 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF5C00]/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></span>
            LIVE • Deadlock Competitive Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            COMPETE FOR<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]">
              GLORY
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            The premier platform for Deadlock XP matches, exclusive ranks, and competitive ladders.
            Login with Steam. Climb the Citadel ranks. Prove yourself.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {profile ? (
              <>
                <Link href="/matches" className="btn-primary px-10 py-4 rounded-xl text-base glow-orange font-semibold">
                  Find a Match
                </Link>
                <Link href="/ranks" className="px-8 py-4 rounded-xl border border-[#1c1c28] hover:border-[#FF5C00]/50 transition">
                  View Ranks
                </Link>
              </>
            ) : (
              <a href="/api/steam/login" className="btn-primary px-10 py-4 rounded-xl text-base glow-orange font-semibold">
                Login with Steam
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-[#1c1c28]">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-[#FF5C00] font-bold text-xl mb-2">XP Matches</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Free competitive matches. Win or lose, you still earn XP and climb the exclusive Citadel ranks.
            </p>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-purple-400 font-bold text-xl mb-2">Street Brawl & Normal</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              1v1 to 4v4 play Street Brawl. 6v6 plays normal mode. Clean and competitive.
            </p>
          </div>
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 hover:border-[#FF5C00]/40 transition">
            <div className="text-emerald-400 font-bold text-xl mb-2">Steam Verified</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Login with Steam only. Your real name and avatar are always shown. No smurfs.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-[#1c1c28] text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to enter the Citadel?</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          Join the growing competitive Deadlock community and start climbing today.
        </p>
        {profile ? (
          <Link href="/matches" className="btn-primary px-8 py-3.5 rounded-xl inline-block">
            Find a Match
          </Link>
        ) : (
          <a href="/api/steam/login" className="btn-primary px-8 py-3.5 rounded-xl inline-block">
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