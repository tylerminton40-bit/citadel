"use client"

import { useEffect, useState } from "react"
import { setCaptainReady } from "@/app/scrims/actions"

export default function ScrimLobby({
  scrimId,
  talkEndsAt,
  creatorReady,
  opponentReady,
  isCreator,
  isOpponentCaptain,
  creatorName,
  opponentName,
}: {
  scrimId: string
  talkEndsAt: string | null
  creatorReady: boolean
  opponentReady: boolean
  isCreator: boolean
  isOpponentCaptain: boolean
  creatorName: string
  opponentName: string
}) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    function tick() {
      if (!talkEndsAt) {
        setSecondsLeft(0)
        return
      }
      const diff = Math.max(0, Math.floor((new Date(talkEndsAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [talkEndsAt])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const iAmReady = isCreator ? creatorReady : isOpponentCaptain ? opponentReady : false
  const canReady = (isCreator || isOpponentCaptain) && !iAmReady

  return (
    <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 mb-6 space-y-5">
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Talk window</div>
        <div className={`text-4xl font-black tabular-nums ${secondsLeft <= 30 ? "text-red-400" : "text-[#FF5C00]"}`}>
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Discuss picks/bans. Both captains ready up to start the draft choice.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 text-center border ${creatorReady ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"}`}>
          <div className="text-sm font-medium truncate">{creatorName}</div>
          <div className={`text-xs mt-1 ${creatorReady ? "text-emerald-400" : "text-gray-500"}`}>
            {creatorReady ? "Ready" : "Not ready"}
          </div>
        </div>
        <div className={`rounded-xl p-4 text-center border ${opponentReady ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#1c1c28]"}`}>
          <div className="text-sm font-medium truncate">{opponentName}</div>
          <div className={`text-xs mt-1 ${opponentReady ? "text-emerald-400" : "text-gray-500"}`}>
            {opponentReady ? "Ready" : "Not ready"}
          </div>
        </div>
      </div>

      {canReady && (
        <form action={setCaptainReady.bind(null, scrimId)}>
          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold">
            Ready Up
          </button>
        </form>
      )}

      {iAmReady && !(creatorReady && opponentReady) && (
        <div className="text-center text-sm text-emerald-400">You’re ready — waiting on the other captain</div>
      )}
    </div>
  )
}