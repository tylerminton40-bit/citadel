const BASE_URL = "https://api.deadlock-api.com"

export function toSteamID3(steamId64: string | number): number {
  const id = BigInt(steamId64)
  return Number(id - BigInt("76561197960265728"))
}

export type DeadlockMatch = {
  match_id: number
  start_time: number
  match_result: number
  player_team: number
  hero_id: number
  player_kills: number
  player_deaths: number
  player_assists: number
}

export async function getPlayerMatchHistory(
  steamId64: string,
  limit = 15
): Promise<DeadlockMatch[]> {
  try {
    const accountId = toSteamID3(steamId64)
    const url = `${BASE_URL}/v1/players/${accountId}/match-history?limit=${limit}&only_stored_history=true`

    const res = await fetch(url, {
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      console.error("Deadlock API error:", res.status)
      return []
    }

    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error("Failed to fetch match history:", err)
    return []
  }
}

export async function findWinnerFromHistory(
  steamId1: string,
  steamId2: string,
  acceptedAt: string | Date,
  windowMinutes = 120
) {
  const [history1, history2] = await Promise.all([
    getPlayerMatchHistory(steamId1),
    getPlayerMatchHistory(steamId2),
  ])

  if (!history1.length || !history2.length) return null

  const accepted = new Date(acceptedAt).getTime() / 1000
  const window = windowMinutes * 60

  for (const m1 of history1) {
    if (Math.abs(m1.start_time - accepted) > window) continue

    const m2 = history2.find((m) => m.match_id === m1.match_id)
    if (!m2) continue

    const player1Won =
      (m1.player_team === 0 && m1.match_result === 0) ||
      (m1.player_team === 1 && m1.match_result === 1)

    return {
      match_id: m1.match_id,
      winnerSteamId: player1Won ? steamId1 : steamId2,
      loserSteamId: player1Won ? steamId2 : steamId1,
      start_time: m1.start_time,
    }
  }

  return null
}