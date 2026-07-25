"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Match = {
  id: string
  format: string
  best_of?: string
  region: string
  created_at: string
  creator: {
    steam_name: string
    avatar_url: string | null
  } | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function HomeOpenMatches({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState(initialMatches)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches?tab=open&t=${Date.now()}`)
        const data = await res.json()
        if (data.matches) setMatches(data.matches.slice(0, 6))
      } catch (err) {
        console.error(err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {matches && matches.length > 0 ? (
        matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="flex items-center justify-between p-3 rounded-xl bg-[#08080d] hover:bg-[#0c0c14] transition"
          >
            <div className="flex items-center gap-3">
              {m.creator?.avatar_url && (
                <img src={m.creator.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              )}
              <div>
                <div className="text-sm font-medium">{m.creator?.steam_name}</div>
                <div className="text-xs text-gray-500">
                  {m.format} • {m.best_of} • {m.region}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500">{timeAgo(m.created_at)}</span>
          </Link>
        ))
      ) : (
        <div className="text-sm text-gray-500 py-6 text-center">No open matches right now</div>
      )}
    </div>
  )
}