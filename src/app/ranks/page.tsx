import Link from "next/link"
import Navbar from "@/components/Navbar"

const ranks = [
  { name: "Ember", xp: 0, color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/40", desc: "The spark begins." },
  { name: "Cinder", xp: 150, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", desc: "Heat is rising." },
  { name: "Forge", xp: 400, color: "text-teal-400", bg: "bg-teal-500/20", border: "border-teal-500/40", desc: "Shaped by fire." },
  { name: "Iron", xp: 800, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40", desc: "Solid and reliable." },
  { name: "Steel", xp: 1400, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40", desc: "Tempered and sharp." },
  { name: "Crimson", xp: 2200, color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40", desc: "Blood and victory." },
  { name: "Obsidian", xp: 3300, color: "text-violet-300", bg: "bg-violet-500/20", border: "border-violet-500/40", desc: "Dark and unbreakable." },
  { name: "Void", xp: 5000, color: "text-fuchsia-400", bg: "bg-fuchsia-500/20", border: "border-fuchsia-500/40", desc: "Beyond the known." },
  { name: "Radiant", xp: 7500, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/40", desc: "Blinding excellence." },
  { name: "Eternal", xp: 11000, color: "text-yellow-300", bg: "bg-yellow-500/20", border: "border-yellow-500/40", desc: "The highest peak." },
]

export default function RanksPage() {
  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Citadel Ranks</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Our exclusive ranking system. Climb by winning XP matches.
            Every win and loss moves you forward.
          </p>
        </div>

        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 mb-12 text-center">
          <h2 className="font-bold text-lg mb-4 text-[#FF5C00]">XP Rules</h2>
          <div className="flex justify-center gap-12 text-sm">
            <div>
              <div className="text-2xl font-bold text-emerald-400">+30 XP</div>
              <div className="text-gray-400">Win</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">-20 XP</div>
              <div className="text-gray-400">Loss</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {ranks.map((rank, i) => (
            <div
              key={rank.name}
              className={`flex items-center justify-between p-5 rounded-2xl border ${rank.border} ${rank.bg} transition hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-5">
                <div className={`text-2xl font-bold w-8 ${rank.color}`}>
                  {i + 1}
                </div>
                <div>
                  <div className={`text-xl font-bold ${rank.color}`}>
                    {rank.name}
                  </div>
                  <div className="text-sm text-gray-400">{rank.desc}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">XP Required</div>
                <div className={`font-bold ${rank.color}`}>
                  {rank.xp.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}