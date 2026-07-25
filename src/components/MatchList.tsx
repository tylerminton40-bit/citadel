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
  creator_id?: string
  opponent_id?: string
  winner_id?: string | null
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    setMatches(initialMatches)
  }, [initialMatches, currentTab])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches?tab=${currentTab}&t=${Date.now()}`)
        const data = await res.json()
        if (data.matches) setMatches(data.matches)
        if (data.currentUserId) setCurrentUserId(data.currentUserId)
      } catch (err) {
        console.error(err)
      }
    }, 5000)

    fetch(`/api/matches?tab=${currentTab}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) setMatches(data.matches)
        if (data.currentUserId) setCurrentUserId(data.currentUserId)
      })

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
    <div className="space-y-3 sm:space-y-4">
      {matches.map((match) => {
        let resultLabel = match.status
        let resultColor = "bg-gray-500/15 text-gray-400"

        if (match.status === "open") {
          resultLabel = "open"
          resultColor = "bg-yellow-500/15 text-yellow-400"
        } else if (match.status === "accepted") {
          resultLabel = "accepted"
          resultColor = "bg-emerald-500/15 text-emerald-400"
        } else if (match.status === "disputed") {
          resultLabel = "disputed"
          resultColor = "bg-red-500/15 text-red-400"
        } else if (match.status === "completed" && currentUserId && match.winner_id) {
          if (match.winner_id === currentUserId) {
            resultLabel = "WIN"
            resultColor = "bg-emerald-500/20 text-emerald-400"
          } else {
            resultLabel = "LOSS"
            resultColor = "bg-red-500/20 text-red-400"
          }
        } else if (match.status === "completed") {
          resultLabel = "completed"
          resultColor = "bg-blue-500/15 text-blue-400"
        }

        return (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-3 sm:p-5 flex items-center justify-between hover:border-[#FF5C00]/40 transition gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {match.creator?.avatar_url && (
                <img
                  src={match.creator.avatar_url}
                  alt=""
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">{match.creator?.steam_name || "Unknown"}</div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">
                  {match.format} • {match.best_of || "Bo1"} • {match.region} • {match.ruleset}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                {timeAgo(match.created_at)}
              </span>
              <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full font-medium ${resultColor}`}>
                {resultLabel}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}