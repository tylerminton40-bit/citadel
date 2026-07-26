import Navbar from "@/components/Navbar"
import Link from "next/link"

const ranks = [
  { name: "Ember", xp: 0, color: "text-gray-300", ring: "ring-gray-500/40", glow: "shadow-gray-500/20", bg: "from-gray-900 to-gray-800", symbol: "✦", tagline: "The spark begins" },
  { name: "Cinder", xp: 150, color: "text-emerald-400", ring: "ring-emerald-500/50", glow: "shadow-emerald-500/30", bg: "from-emerald-950 to-gray-900", symbol: "◆", tagline: "Heat is rising" },
  { name: "Forge", xp: 400, color: "text-teal-400", ring: "ring-teal-500/50", glow: "shadow-teal-500/30", bg: "from-teal-950 to-gray-900", symbol: "◈", tagline: "Shaped by fire" },
  { name: "Iron", xp: 800, color: "text-blue-400", ring: "ring-blue-500/50", glow: "shadow-blue-500/30", bg: "from-blue-950 to-gray-900", symbol: "▣", tagline: "Solid and reliable" },
  { name: "Steel", xp: 1400, color: "text-purple-400", ring: "ring-purple-500/50", glow: "shadow-purple-500/30", bg: "from-purple-950 to-gray-900", symbol: "⬡", tagline: "Tempered and sharp" },
  { name: "Crimson", xp: 2200, color: "text-red-400", ring: "ring-red-500/50", glow: "shadow-red-500/30", bg: "from-red-950 to-gray-900", symbol: "⚔", tagline: "Blood and victory" },
  { name: "Obsidian", xp: 3300, color: "text-violet-300", ring: "ring-violet-500/50", glow: "shadow-violet-500/30", bg: "from-violet-950 to-gray-900", symbol: "◉", tagline: "Dark and unbreakable" },
  { name: "Void", xp: 5000, color: "text-fuchsia-400", ring: "ring-fuchsia-500/50", glow: "shadow-fuchsia-500/30", bg: "from-fuchsia-950 to-gray-900", symbol: "◈", tagline: "Beyond the known" },
  { name: "Radiant", xp: 7500, color: "text-orange-400", ring: "ring-orange-500/60", glow: "shadow-orange-500/40", bg: "from-orange-950 to-gray-900", symbol: "✸", tagline: "Blinding excellence" },
  { name: "Eternal", xp: 11000, color: "text-yellow-300", ring: "ring-yellow-400/70", glow: "shadow-yellow-400/50", bg: "from-yellow-950 to-orange-950", symbol: "♛", tagline: "The highest peak" },
]

export default function RanksPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-gray-200 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF5C00]/20 via-[#FF5C00]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5C00]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] text-xs font-bold tracking-widest uppercase mb-6">
            Exclusive Rank System
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-none mb-4 tracking-tight">
            CLIMB TO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] via-[#FF8A00] to-yellow-300">
              ETERNAL
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Every match matters. Every win pushes you higher.
            Prove you belong among the elite.
          </p>
          <div className="flex justify-center gap-8 sm:gap-12">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">+30</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Win XP</div>
            </div>
            <div className="w-px bg-[#1c1c28]" />
            <div>
              <div className="text-3xl sm:text-4xl font-black text-red-400">−20</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Loss XP</div>
            </div>
            <div className="w-px bg-[#1c1c28]" />
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FF5C00]">10</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Ranks</div>
            </div>
          </div>
        </div>
      </section>

      {/* ETERNAL FEATURED */}
      <section className="px-4 mb-10">
        <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden border border-yellow-500/40 bg-gradient-to-br from-yellow-950/80 via-[#111118] to-orange-950/60 p-8 sm:p-12 text-center shadow-2xl shadow-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-6xl sm:text-7xl mb-4 text-yellow-300 drop-shadow-[0_0_30px_rgba(253,224,71,0.5)]">♛</div>
            <div className="text-xs uppercase tracking-[0.3em] text-yellow-500/80 font-bold mb-2">Highest Rank</div>
            <h2 className="text-4xl sm:text-5xl font-black text-yellow-300 mb-2">ETERNAL</h2>
            <p className="text-yellow-200/60 text-sm mb-4">The highest peak · 11,000 XP</p>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Reserved for those who refuse to stop. Only the most dedicated reach this status.
            </p>
          </div>
        </div>
      </section>

      {/* RANK PATH */}
      <section className="px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm uppercase tracking-[0.25em] text-gray-500 font-bold mb-8">
            The Path to Glory
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {ranks.map((rank, i) => (
              <div
                key={rank.name}
                className={`relative group rounded-2xl bg-gradient-to-b ${rank.bg} border border-white/5 ring-1 ${rank.ring} p-5 sm:p-6 text-center shadow-xl ${rank.glow} hover:scale-[1.04] hover:border-white/10 transition duration-300`}
              >
                <div className="absolute top-3 left-3 text-[10px] font-bold text-white/20">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className={`text-3xl sm:text-4xl mb-3 ${rank.color} drop-shadow-lg group-hover:scale-110 transition duration-300`}>
                  {rank.symbol}
                </div>
                <div className={`text-base sm:text-lg font-black ${rank.color} mb-1`}>
                  {rank.name}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mb-3 leading-tight">
                  {rank.tagline}
                </div>
                <div className={`text-xs font-bold ${rank.color} opacity-80`}>
                  {rank.xp === 0 ? "START" : `${rank.xp.toLocaleString()} XP`}
                </div>
                {i === ranks.length - 1 && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-yellow-500 text-black text-[9px] font-black tracking-wider">
                    MAX
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — tight spacing */}
      <section className="px-4 pt-14 pb-20 text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black leading-tight">
            Your name belongs on this list
          </h3>
          <p className="text-gray-400 text-sm">
            Open a match. Win. Climb. Become Eternal.
          </p>
          <div className="pt-2">
            <Link
              href="/matches"
              className="inline-block btn-primary px-10 py-4 rounded-xl text-base font-bold"
            >
              Start Climbing →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}