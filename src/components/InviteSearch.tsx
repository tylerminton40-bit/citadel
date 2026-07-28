"use client"

import { useMemo, useState } from "react"
import { invitePlayerById } from "@/app/teams/actions"

type Player = {
  id: string
  steam_name: string
  avatar_url: string | null
  xp: number
}

export default function InviteSearch({
  teamId,
  players,
}: {
  teamId: string
  players: Player[]
}) {
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Player | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return players.slice(0, 30)
    return players
      .filter((p) => p.steam_name.toLowerCase().includes(term))
      .slice(0, 30)
  }, [q, players])

  return (
    <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Search player</label>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setSelected(null)
          }}
          placeholder="Type Steam name..."
          className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
        />
      </div>

      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#08080d] border border-[#FF5C00]/40">
          {selected.avatar_url ? (
            <img src={selected.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#1c1c28]" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selected.steam_name}</div>
            <div className="text-xs text-gray-500">{selected.xp} XP</div>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs text-gray-500 hover:text-white"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-[#1c1c28]">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 text-center">No players found</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#08080d] transition text-left"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1c1c28]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.steam_name}</div>
                </div>
                <span className="text-xs text-gray-500">{p.xp} XP</span>
              </button>
            ))
          )}
        </div>
      )}

      <form action={invitePlayerById.bind(null, teamId)}>
        <input type="hidden" name="player_id" value={selected?.id || ""} />
        <button
          type="submit"
          disabled={!selected}
          className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-40"
        >
          Send Invite
        </button>
      </form>
    </div>
  )
}