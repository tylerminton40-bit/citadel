"use client"

import { useEffect, useState, useCallback } from "react"
import { HEROES, DRAFT_STEPS, type DraftState } from "@/lib/deadlock-heroes"

type ScrimLiveData = {
  id: string
  status: string
  talk_ends_at: string | null
  creator_ready: boolean
  opponent_ready: boolean
  host_team_id: string | null
  first_ban_team_id: string | null
  draft_state: DraftState | null
  creator_team_id: string
  opponent_team_id: string | null
  creator_id: string
  opponent_captain_id: string | null
    private_code?: string | null
  creator_report?: string | null
  opponent_report?: string | null
}

export default function ScrimLive({
  scrimId,
  initial,
  profileId,
  creatorName,
  opponentName,
}: {
  scrimId: string
  initial: ScrimLiveData
  profileId: string
  creatorName: string
  opponentName: string
}) {
  const [data, setData] = useState<ScrimLiveData>(initial)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [busy, setBusy] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/scrims/${scrimId}/live?t=${Date.now()}`)
      const json = await res.json()
      if (json?.id) setData(json)
    } catch {}
  }, [scrimId])

  // Live poll every 2s
  useEffect(() => {
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [poll])

  // Talk timer
  useEffect(() => {
    function tick() {
      if (!data.talk_ends_at) {
        setSecondsLeft(0)
        return
      }
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(data.talk_ends_at).getTime() - Date.now()) / 1000))
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [data.talk_ends_at])

  async function postAction(body: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch(`/api/scrims/${scrimId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json?.id) setData(json)
      else await poll()
    } catch {}
    setBusy(false)
  }

  const isCreator = profileId === data.creator_id
  const isOppCap = profileId === data.opponent_captain_id
  const isCaptain = isCreator || isOppCap

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  // ---------- ACCEPTED: talk + ready ----------
  if (data.status === "accepted") {
    const iAmReady = isCreator ? data.creator_ready : isOppCap ? data.opponent_ready : false
    const canReady = isCaptain && !iAmReady

    return (
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-5">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Talk window · live</div>
          <div className={`text-4xl font-black tabular-nums ${secondsLeft <= 30 ? "text-red-400" : "text-[#FF5C00]"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <p className="text-xs text-gray-500 mt-2">Both captains ready up — updates live, no refresh</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-4 text-center border transition ${data.creator_ready ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"}`}>
            <div className="text-sm font-medium truncate">{creatorName}</div>
            <div className={`text-xs mt-1 ${data.creator_ready ? "text-emerald-400" : "text-gray-500"}`}>
              {data.creator_ready ? "Ready ✓" : "Not ready"}
            </div>
          </div>
          <div className={`rounded-xl p-4 text-center border transition ${data.opponent_ready ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"}`}>
            <div className="text-sm font-medium truncate">{opponentName}</div>
            <div className={`text-xs mt-1 ${data.opponent_ready ? "text-emerald-400" : "text-gray-500"}`}>
              {data.opponent_ready ? "Ready ✓" : "Not ready"}
            </div>
          </div>
        </div>

        {canReady && (
          <button
            disabled={busy}
            onClick={() => postAction({ action: "ready" })}
            className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {busy ? "…" : "Ready Up"}
          </button>
        )}
        {iAmReady && !(data.creator_ready && data.opponent_ready) && (
          <div className="text-center text-sm text-emerald-400">You’re ready — waiting on other captain</div>
        )}
      </div>
    )
  }

  // ---------- CHOOSING ----------
  if (data.status === "choosing") {
    return (
      <div className="bg-[#111118] border border-[#FF5C00]/40 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Side choice · live</h2>
        {isOppCap ? (
          <>
            <p className="text-sm text-gray-400">You accepted — pick Host or First Ban.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy}
                onClick={() => postAction({ action: "choose", choice: "host" })}
                className="py-4 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/40 text-[#FF5C00] font-bold hover:bg-[#FF5C00]/25 disabled:opacity-50"
              >
                Host
              </button>
              <button
                disabled={busy}
                onClick={() => postAction({ action: "choose", choice: "first_ban" })}
                className="py-4 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-500/25 disabled:opacity-50"
              >
                First Ban
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 animate-pulse">
            Waiting for accepting captain to choose Host or First Ban…
          </p>
        )}
      </div>
    )
  }

  // ---------- DRAFTING / LIVE (show draft board) ----------
  if (data.status === "drafting" || data.status === "live") {
    const state: DraftState = data.draft_state || {
      step: 0,
      withinStep: 0,
      bans: [],
      picks: [],
      phase: "ban",
      turn_team_id: data.first_ban_team_id,
    }

    const myTeamId = isCreator
      ? data.creator_team_id
      : isOppCap
      ? data.opponent_team_id
      : null

    const taken = new Set([
      ...state.bans.map((b) => b.heroId),
      ...state.picks.map((p) => p.heroId),
    ])
    const step = DRAFT_STEPS[state.step]
    const myTurn =
      isCaptain && state.phase !== "done" && state.turn_team_id === myTeamId && data.status === "drafting"

    const labelFor = (teamId: string | null) =>
      teamId === data.creator_team_id ? creatorName : opponentName

    const heroName = (id: string) => HEROES.find((h) => h.id === id)?.name || id

    return (
      <div className="space-y-6">
        <div className="text-center">
          {state.phase === "done" || data.status === "live" ? (
            <div className="text-lg font-bold text-emerald-400">Draft complete · live</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {step?.type === "ban" ? "Ban" : "Pick"} · live
              </div>
              <div className="font-bold text-[#FF5C00]">
                {state.turn_team_id
                  ? `${labelFor(state.turn_team_id)} — ${step?.type} (${(step?.count || 1) - (state.withinStep || 0)} left)`
                  : "…"}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[data.creator_team_id, data.opponent_team_id].filter(Boolean).map((tid) => (
            <div key={tid!} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4">
              <div className="text-sm font-bold mb-2 truncate">{labelFor(tid!)}</div>
              <div className="text-[10px] text-gray-500 mb-1">PICKS</div>
              <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
                {state.picks
                  .filter((p) => p.teamId === tid)
                  .map((p) => (
                    <span key={p.heroId} className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      {heroName(p.heroId)}
                    </span>
                  ))}
              </div>
              <div className="text-[10px] text-gray-500 mb-1">BANS</div>
              <div className="flex flex-wrap gap-1 min-h-[28px]">
                {state.bans
                  .filter((b) => b.teamId === tid)
                  .map((b) => (
                    <span key={b.heroId} className="text-[11px] px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 line-through">
                      {heroName(b.heroId)}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {data.status === "drafting" && state.phase !== "done" && (
          <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-3">
              {myTurn ? "Your turn — tap a hero" : "Waiting for other captain…"}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {HEROES.map((h) => {
                const used = taken.has(h.id)
                return (
                  <button
                    key={h.id}
                    disabled={!myTurn || used || busy}
                    onClick={() => postAction({ action: "draft", hero_id: h.id })}
                    className={`w-full py-2.5 px-2 rounded-xl text-xs font-medium transition ${
                      used
                        ? "bg-[#08080d] text-gray-600 line-through cursor-not-allowed"
                        : myTurn
                        ? "bg-[#08080d] border border-[#1c1c28] hover:border-[#FF5C00] hover:text-[#FF5C00]"
                        : "bg-[#08080d] text-gray-500 cursor-default"
                    }`}
                  >
                    {h.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

                {data.status === "live" && (
          <div className="space-y-4">
            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <h3 className="font-bold text-[#FF5C00] mb-2">How to play (6v6 Normal)</h3>
              <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
                <li>Host creates a private match in Deadlock (normal 6v6 rules)</li>
                <li>Host posts the join code below</li>
                <li>Everyone joins with that code</li>
                <li>Play the series, then both captains report</li>
              </ol>
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <h3 className="font-bold mb-3">Match code · live</h3>
              {data.private_code ? (
                <div className="text-2xl font-mono font-bold text-center py-3 bg-[#08080d] rounded-xl mb-3">
                  {data.private_code}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3 text-center">Waiting for host to post code…</p>
              )}
              {/* Host captain only — simplify: allow either captain for now if host unknown */}
              {(isCreator || isOppCap) && (
                <div className="flex gap-2">
                  <input
                    id="scrim-code-input"
                    type="text"
                    placeholder="Enter join code"
                    className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const el = document.getElementById("scrim-code-input") as HTMLInputElement
                      if (el?.value) postAction({ action: "code", code: el.value })
                    }}
                    className="btn-primary px-4 py-2.5 rounded-xl text-sm"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>

            {(isCreator || isOppCap) && (
              <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
                <h3 className="font-bold mb-3">Report result</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => postAction({ action: "report", winner: "creator" })}
                    className="py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-medium text-sm"
                  >
                    {creatorName} won
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => postAction({ action: "report", winner: "opponent" })}
                    className="py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-medium text-sm"
                  >
                    {opponentName} won
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Both captains must report. Agree → +60 / −40 XP. Disagree → disputed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}