import Navbar from "@/components/Navbar"
import Link from "next/link"

const ranks = [
  { name: "Ember", xp: 0, color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30", glow: "shadow-gray-500/10" },
  { name: "Cinder", xp: 150, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  { name: "Forge", xp: 400, color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30", glow: "shadow-teal-500/10" },
  { name: "Iron", xp: 800, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30", glow: "shadow-blue-500/10" },
  { name: "Steel", xp: 1400, color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30", glow: "shadow-purple-500/10" },
  { name: "Crimson", xp: 2200, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30", glow: "shadow-red-500/10" },
  { name: "Obsidian", xp: 3300, color: "text-violet-300", bg: "bg-violet-500/15", border: "border-violet-500/30", glow: "shadow-violet-500/10" },
  { name: "Void", xp: 5000, color: "text-fuchsia-400", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/30", glow: "shadow-fuchsia-500/10" },
  { name: "Radiant", xp: 7500, color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", glow: "shadow-orange-500/10" },
  { name: "Eternal", xp: 11000, color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/30", glow: "shadow-yellow-500/20" },
]

export default function RanksPage() {
  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Citadel Ranks</h1>
          <p className="text-gray-400 text-sm">
            Climb by winning XP matches • <span className="text-emerald-400">+30 win</span> / <span className="text-red-400">−20 loss</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {ranks.map((rank, i) => (
            <div
              key={rank.name}
              className={`relative rounded-2xl border ${rank.border} ${rank.bg} p-4 sm:p-5 text-center shadow-lg ${rank.glow} hover:scale-[1.03] transition`}
            >
              <div className={`text-[10px] uppercase tracking-widest mb-2 opacity-60 ${rank.color}`}>
                #{i + 1}
              </div>
              <div className={`text-lg sm:text-xl font-black ${rank.color} mb-1`}>
                {rank.name}
              </div>
              <div className="text-xs text-gray-500">
                {rank.xp.toLocaleString()} XP
              </div>
              {i === ranks.length - 1 && (
                <div className="absolute -top-2 -right-2 text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
                  MAX
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/matches" className="btn-primary px-8 py-3 rounded-xl text-sm inline-block">
            Climb the Ranks
          </Link>
        </div>
      </main>
    </div>
  )
}