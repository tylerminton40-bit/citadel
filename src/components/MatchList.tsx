"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Match = {
  id: string
  format: string
  region: string
  ruleset: string
  status: string
  created_at: string
  best_of?: string
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

export default function MatchList({
  initialMatches,
  currentTab,
}: {
  initialMatches: Match[]
  currentTab: string
}) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  // Keep local state in sync when tab changes
  useEffect(() => {
    setMatches(initialMatches)
  }, [initialMatches, currentTab])

  // Quiet background refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches?tab=${currentTab}&t=${Date.now()}`)
        const data = await res.json()
        if (data.matches) {
          setMatches(data.matches)
        }
      } catch (err) {
        console.error(err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [currentTab])

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        {currentTab === "open" ? "No open matches right now." : "You have no matches yet."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/matches/${match.id}`}
          className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 flex items-center justify-between hover:border-[#FF5C00]/40 transition block"
        >
          <div className="flex items-center gap-4">
            {match.creator?.avatar_url && (
              <img
                src={match.creator.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="font-medium">{match.creator?.steam_name || "Unknown"}</div>
              <div className="text-sm text-gray-400">
                {match.format} • {match.best_of || "Bo1"} • {match.region} • {match.ruleset}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{timeAgo(match.created_at)}</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                match.status === "open"
                  ? "bg-yellow-500/15 text-yellow-400"
                  : match.status === "accepted"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : match.status === "completed"
                  ? "bg-blue-500/15 text-blue-400"
                  : match.status === "disputed"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-gray-500/15 text-gray-400"
              }`}
            >
              {match.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}