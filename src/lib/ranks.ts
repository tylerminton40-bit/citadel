export const RANKS = [
  { name: "Ember", xp: 0, color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/40" },
  { name: "Cinder", xp: 150, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
  { name: "Forge", xp: 400, color: "text-teal-400", bg: "bg-teal-500/20", border: "border-teal-500/40" },
  { name: "Iron", xp: 800, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { name: "Steel", xp: 1400, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40" },
  { name: "Crimson", xp: 2200, color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
  { name: "Obsidian", xp: 3300, color: "text-violet-300", bg: "bg-violet-500/20", border: "border-violet-500/40" },
  { name: "Void", xp: 5000, color: "text-fuchsia-400", bg: "bg-fuchsia-500/20", border: "border-fuchsia-500/40" },
  { name: "Radiant", xp: 7500, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  { name: "Eternal", xp: 11000, color: "text-yellow-300", bg: "bg-yellow-500/20", border: "border-yellow-500/40" },
]

export function getRank(xp: number) {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (xp >= rank.xp) current = rank
  }
  return current
}

export function getNextRank(xp: number) {
  for (const rank of RANKS) {
    if (xp < rank.xp) return rank
  }
  return null // already Eternal
}