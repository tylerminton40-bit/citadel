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
      <section className="relative pt-28 pb-28 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5C00]/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></span>
            LIVE • Deadlock Competitive Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            COMPETE FOR<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] via-[#FF8A00] to-[#FF5C00]">
              GLORY
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The competitive home for Deadlock. XP matches, exclusive ranks from Ember to Eternal, 
            and a clean dispute system. Login with Steam. Climb the Citadel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {profile ? (
              <>
                <Link href="/matches" className="btn-primary px-10 py-4 rounded-xl text-base font-semibold glow-orange">
                  Find a Match
                </Link>
                <Link href="/ranks" className="px-8 py-4 rounded-xl border border-[#1c1c28] hover:border-[#FF5C00]/50 transition text-sm">
                  View Ranks
                </Link>
              </>
            ) : (
              <a href="/api/steam/login" className="btn-primary px-10 py-4 rounded-xl text-base font-semibold glow-orange">
                Login with Steam
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-[#1c1c28]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need to compete</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-7 hover:border-[#FF5C00]/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mb-5 text-[#FF5C00] font-bold text-lg group-hover:scale-110 transition">
                XP
              </div>
              <h3 className="font-bold text-lg mb-2">XP Matches</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Free competitive matches. Every game earns XP. Climb from Ember all the way to Eternal.
              </p>
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-7 hover:border-purple-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5 text-purple-400 font-bold text-lg group-hover:scale-110 transition">
                SB
              </div>
              <h3 className="font-bold text-lg mb-2">Street Brawl & Normal</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                1v1–4v4 play Street Brawl. 6v6 plays Normal. Clean formats, no confusion.
              </p>
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-7 hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 text-emerald-400 font-bold text-lg group-hover:scale-110 transition">
                ✓
              </div>
              <h3 className="font-bold text-lg mb-2">Steam Verified</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Login with Steam only. Real names, real ranks, no smurfs. Fair competition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-[#1c1c28]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-12">How it works</h2>
          <div className="grid sm:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-3xl font-black text-[#FF5C00] mb-3">1</div>
              <div className="font-medium mb-1">Create or Accept</div>
              <div className="text-gray-400">Post a match or take someone else’s</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#FF5C00] mb-3">2</div>
              <div className="font-medium mb-1">Play in Deadlock</div>
              <div className="text-gray-400">Host posts the private match code</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#FF5C00] mb-3">3</div>
              <div className="font-medium mb-1">Report Result</div>
              <div className="text-gray-400">Both players confirm the winner</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#FF5C00] mb-3">4</div>
              <div className="font-medium mb-1">Earn XP</div>
              <div className="text-gray-400">Climb the exclusive Citadel ranks</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#1c1c28] text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to enter the Citadel?</h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          Join the competitive Deadlock community and start climbing today.
        </p>
        {profile ? (
          <Link href="/matches" className="btn-primary px-10 py-4 rounded-xl inline-block font-semibold">
            Find a Match
          </Link>
        ) : (
          <a href="/api/steam/login" className="btn-primary px-10 py-4 rounded-xl inline-block font-semibold">
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