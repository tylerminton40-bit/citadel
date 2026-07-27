"use client"

import Link from "next/link"

type Team = {
  id: string
  name: string
  tag: string | null
  avatar_url: string | null
  wins?: number
  losses?: number
}

type Scrim = {
  id: string
  status: string
  visibility: string
  scheduled_at: string | null
  created_at: string
  creator_team: Team | null
  opponent_team: Team | null
}

function formatWhen(iso: string | null) {
  if (iso) {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return "ASAP"
}

function statusStyle(status: string) {
  if (status === "open") return "bg-yellow-500/15 text-yellow-400"
  if (status === "accepted" || status === "choosing")
    return "bg-emerald-500/15 text-emerald-400"
  if (status === "drafting") return "bg-purple-500/15 text-purple-300"
  if (status === "live") return "bg-[#FF5C00]/15 text-[#FF5C00]"
  if (status === "completed") return "bg-blue-500/15 text-blue-400"
  if (status === "disputed") return "bg-red-500/15 text-red-400"
  return "bg-gray-500/15 text-gray-400"
}

export default function ScrimList({
  initialScrims,
  currentTab,
}: {
  initialScrims: Scrim[]
  currentTab: string
}) {
  if (!initialScrims?.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        {currentTab === "open"
          ? "No open scrims right now."
          : currentTab === "yours"
          ? "No scrims for your teams yet."
          : "Nothing here yet."}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {initialScrims.map((s) => (
        <Link
          key={s.id}
          href={`/scrims/${s.id}`}
          className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-4 sm:p-5 hover:border-[#FF5C00]/40 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {s.creator_team?.avatar_url ? (
                <img
                  src={s.creator_team.avatar_url}
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#1c1c28] flex items-center justify-center text-[#FF5C00] font-bold shrink-0">
                  {s.creator_team?.tag?.[0] || "S"}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {s.creator_team?.tag ? `[${s.creator_team.tag}] ` : ""}
                  {s.creator_team?.name || "Team"}
                  {s.opponent_team
                    ? ` vs ${s.opponent_team.tag ? `[${s.opponent_team.tag}] ` : ""}${s.opponent_team.name}`
                    : ""}
                </div>
                <div className="text-xs text-gray-500">
                  {formatWhen(s.scheduled_at)}
                  {s.visibility === "private" ? " · Invite only" : " · Open"}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 ${statusStyle(
                s.status
              )}`}
            >
              {s.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}