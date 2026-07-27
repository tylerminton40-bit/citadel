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
  const [codeInput, setCodeInput] = useState("")

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/scrims/${scrimId}/live?t=${Date.now()}`)
      const json = await res.json()
      if (json?.id) setData(json)
    } catch {}
  }, [scrimId])

  useEffect(() => {
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [poll])

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

  const myTeamId = isCreator
    ? data.creator_team_id
    : isOppCap
    ? data.opponent_team_id
    : null

  const isHostCaptain =
    !!isCaptain &&
    !!data.host_team_id &&
    !!myTeamId &&
    String(myTeamId) === String(data.host_team_id)

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  if (data.status === "accepted") {
    const iAmReady = isCreator ? data.creator_ready : isOppCap ? data.opponent_ready : false
    const canReady = isCaptain && !iAmReady

    return (
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-5">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Talk window · live</div>
          <div
            className={`text-4xl font-black tabular-nums ${
              secondsLeft <= 30 ? "text-red-400" : "text-[#FF5C00]"
            }`}
          >
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <p className="text-xs text-gray-500 mt-2">Both captains ready up — updates live</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-4 text-center border ${
              data.creator_ready ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"
            }`}
          >
            <div className="text-sm font-medium truncate">{creatorName}</div>
            <div className={`text-xs mt-1 ${data.creator_ready ? "text-emerald-400" : "text-gray-500"}`}>
              {data.creator_ready ? "Ready ✓" : "Not ready"}
            </div>
          </div>
          <div
            className={`rounded-xl p-4 text-center border ${
              data.opponent_ready ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"
            }`}
          >
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
          <div className="text-center text-sm text-emerald-400">
            You’re ready — waiting on other captain
          </div>
        )}
      </div>
    )
  }

  if (data.status === "choosing") {
    return (
      <div className="bg-[#111118] border border-[#FF5C00]/40 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Side choice · live</h2>
        {isOppCap ? (
          <>
            <p className="text-sm text-gray-400">
              You accepted — choose <strong className="text-white">Host</strong> or{" "}
              <strong className="text-white">First Ban</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy}
                onClick={() => postAction({ action: "choose", choice: "host" })}
                className="py-4 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/40 text-[#FF5C00] font-bold disabled:opacity-50"
              >
                Host
              </button>
              <button
                disabled={busy}
                onClick={() => postAction({ action: "choose", choice: "first_ban" })}
                className="py-4 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold disabled:opacity-50"
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

  if (
    data.status === "drafting" ||
    data.status === "live" ||
    data.status === "disputed" ||
    data.status === "completed"
  ) {
    const state: DraftState = data.draft_state || {
      step: 0,
      withinStep: 0,
      bans: [],
      picks: [],
      phase: "ban",
      turn_team_id: data.first_ban_team_id,
    }

    const taken = new Set([
      ...state.bans.map((b) => b.heroId),
      ...state.picks.map((p) => p.heroId),
    ])
    const step = DRAFT_STEPS[state.step]
    const myTurn =
      isCaptain &&
      state.phase !== "done" &&
      state.turn_team_id === myTeamId &&
      data.status === "drafting"

    const labelFor = (teamId: string | null) =>
      teamId === data.creator_team_id ? creatorName : opponentName

    const heroName = (id: string) => HEROES.find((h) => h.id === id)?.name || id

    const alreadyReported = isCreator
      ? !!data.creator_report
      : isOppCap
      ? !!data.opponent_report
      : false

    return (
      <div className="space-y-6">
        {(data.status === "disputed" || data.status === "completed") && (
          <div
            className={`rounded-2xl p-5 border text-center ${
              data.status === "disputed"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
            }`}
          >
            <div className="font-bold text-lg capitalize">{data.status}</div>
            <p className="text-sm mt-1 opacity-80">
              Draft, teams, and details stay visible for review and tickets.
            </p>
          </div>
        )}

        {data.status === "drafting" && (
          <div className="text-center">
            {state.phase === "done" ? (
              <div className="text-lg font-bold text-emerald-400">Draft complete</div>
            ) : (
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {step?.type === "ban" ? "Ban" : "Pick"} · live
                </div>
                <div className="font-bold text-[#FF5C00]">
                  {state.turn_team_id
                    ? `${labelFor(state.turn_team_id)} — ${step?.type} (${
                        (step?.count || 1) - (state.withinStep || 0)
                      } left)`
                    : "…"}
                </div>
              </>
            )}
          </div>
        )}

        {/* Draft summary always visible */}
        <div className="grid grid-cols-2 gap-3">
          {[data.creator_team_id, data.opponent_team_id].filter(Boolean).map((tid) => (
            <div key={tid!} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-4">
              <div className="text-sm font-bold mb-2 truncate">{labelFor(tid!)}</div>
              <div className="text-[10px] text-gray-500 mb-1">PICKS</div>
              <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
                {state.picks
                  .filter((p) => p.teamId === tid)
                  .map((p) => (
                    <span
                      key={p.heroId}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400"
                    >
                      {heroName(p.heroId)}
                    </span>
                  ))}
              </div>
              <div className="text-[10px] text-gray-500 mb-1">BANS</div>
              <div className="flex flex-wrap gap-1 min-h-[28px]">
                {state.bans
                  .filter((b) => b.teamId === tid)
                  .map((b) => (
                    <span
                      key={b.heroId}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 line-through"
                    >
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
              <h3 className="font-bold text-[#FF5C00] mb-3">
                {isHostCaptain ? "Host instructions" : "How to join"}
              </h3>
              {isHostCaptain ? (
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Create a private match in Deadlock (normal 6v6).</li>
                  <li>Use the heroes your team drafted above.</li>
                  <li>Post the join code below so the other team can connect.</li>
                  <li>Wait until all 12 players are in, then start.</li>
                  <li>After the game, report the result below.</li>
                </ol>
              ) : (
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Wait for the host to post the join code below.</li>
                  <li>Copy the code and join their private match in Deadlock.</li>
                  <li>Play the heroes your team drafted.</li>
                  <li>After the game, your captain reports the result below.</li>
                </ol>
              )}
            </div>

            <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
              <h3 className="font-bold mb-3">Match code · live</h3>
              {data.private_code ? (
                <div className="text-2xl font-mono font-bold text-center py-4 bg-[#08080d] rounded-xl mb-2 tracking-wider">
                  {data.private_code}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3 text-center">
                  Waiting for host to post the join code…
                </p>
              )}

              {isHostCaptain ? (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste join code"
                    className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF5C00]"
                  />
                  <button
                    type="button"
                    disabled={busy || !codeInput.trim()}
                    onClick={() => postAction({ action: "code", code: codeInput.trim() })}
                    className="btn-primary px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Only the host captain can post the code.
                </p>
              )}
            </div>

            {isCaptain && (
              <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5">
                <h3 className="font-bold mb-1">Report result</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Both captains report. Agree → +60 / −40 XP. Disagree → disputed.
                </p>

                {alreadyReported ? (
                  <div className="text-center text-sm text-emerald-400 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    You reported — waiting for other captain
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => postAction({ action: "report", winner: "creator" })}
                      className="flex-1 btn-primary py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {creatorName} won
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => postAction({ action: "report", winner: "opponent" })}
                      className="flex-1 py-3 rounded-xl text-sm font-medium border border-[#1c1c28] hover:border-[#FF5C00]/50 transition disabled:opacity-50"
                    >
                      {opponentName} won
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => postAction({ action: "dispute" })}
                  className="w-full mt-3 py-2.5 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  Open dispute
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}