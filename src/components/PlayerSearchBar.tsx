"use client"

import { useState } from "react"
import Link from "next/link"

type Player = {
  id: string
  steam_name: string
  avatar_url: string | null
  xp: number
  wins: number
  losses: number
}

export default function PlayerSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search(q: string) {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setResults(data.players || [])
    } catch {
      setResults([])
    }

    setLoading(false)
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Type a Steam name..."
        autoFocus
        className="w-full bg-[#111118] border-2 border-[#1c1c28] focus:border-[#FF5C00] rounded-2xl px-6 py-4 text-lg text-white placeholder:text-gray-600 outline-none transition"
      />

      <div className="mt-6 space-y-2">
        {loading && (
          <div className="text-center text-gray-500 text-sm py-8">Searching...</div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">No players found</div>
        )}

        {!loading &&
          results.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#111118] border border-[#1c1c28] hover:border-[#FF5C00]/40 transition"
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-11 h-11 rounded-full" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#1c1c28]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.steam_name}</div>
                <div className="text-xs text-gray-500">
                  {p.xp} XP · {p.wins}W {p.losses}L
                </div>
              </div>
              <span className="text-gray-600 text-sm">→</span>
            </Link>
          ))}
      </div>
    </div>
  )
}