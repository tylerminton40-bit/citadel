"use client"

import { useState } from "react"
import Link from "next/link"
import { getRank } from "@/lib/ranks"

type Player = {
  id: string
  steam_name: string
  avatar_url: string | null
  xp: number
  wins: number
  losses: number
}

export default function PlayerSearch({ initialPlayers }: { initialPlayers: Player[] }) {
  const [query, setQuery] = useState("")
  const [players] = useState(initialPlayers)

  const filtered = players.filter((p) =>
    p.steam_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Steam name..."
        className="w-full bg-[#111118] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00] mb-6"
      />

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((player) => {
            const rank = getRank(player.xp || 0)
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center justify-between bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 hover:border-[#FF5C00]/40 transition"
              >
                <div className="flex items-center gap-4">
                  {player.avatar_url && (
                    <img src={player.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  )}
                  <div>
                    <div className="font-medium">{player.steam_name}</div>
                    <div className="text-sm text-gray-400">
                      {player.wins}W / {player.losses}L • {player.xp} XP
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${rank.bg} ${rank.color}`}>
                  {rank.name}
                </span>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-16 text-gray-500">No players found</div>
        )}
      </div>
    </div>
  )
}
