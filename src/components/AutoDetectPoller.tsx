"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { checkMatchResult } from "@/app/matches/actions"

export default function AutoDetectPoller({
  matchId,
  acceptedAt,
  hasReports,
}: {
  matchId: string
  acceptedAt: string | null
  hasReports: boolean
}) {
  const router = useRouter()
  const hasStarted = useRef(false)

  useEffect(() => {
    // Don't run if someone already reported
    if (hasReports || !acceptedAt) return

    const acceptedTime = new Date(acceptedAt).getTime()
    const tenMinutes = 10 * 60 * 1000
    const twoMinutes = 2 * 60 * 1000

    const check = async () => {
      try {
        await checkMatchResult(matchId)
        // If the action redirects with success, the page will reload
        // We also force a soft refresh just in case
        router.refresh()
      } catch (err) {
        // Silent fail – just try again next interval
        console.log("Auto detect check failed, will retry")
      }
    }

    const startPolling = () => {
      if (hasStarted.current) return
      hasStarted.current = true

      // First check immediately when we reach 10 min mark
      check()

      // Then every 2 minutes
      const interval = setInterval(check, twoMinutes)
      return () => clearInterval(interval)
    }

    const now = Date.now()
    const timeSinceAccepted = now - acceptedTime

    if (timeSinceAccepted >= tenMinutes) {
      // Already past 10 minutes – start polling now
      return startPolling()
    } else {
      // Wait until we hit the 10 minute mark
      const waitTime = tenMinutes - timeSinceAccepted
      const timeout = setTimeout(() => {
        startPolling()
      }, waitTime)

      return () => clearTimeout(timeout)
    }
  }, [matchId, acceptedAt, hasReports, router])

  return null // This component is invisible
}