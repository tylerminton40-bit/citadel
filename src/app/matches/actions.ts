"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"
import { bumpLadderEntry } from "@/lib/ladder"

export async function disputeMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match) redirect("/matches")

  const isParticipant =
    profile.id === match.creator_id || profile.id === match.opponent_id

  if (!isParticipant) redirect(`/matches/${matchId}`)

  // Only allowed while accepted (stuck / pending report)
  if (match.status !== "accepted") {
    redirect(`/matches/${matchId}`)
  }

  await supabase
    .from("matches")
    .update({ status: "disputed" })
    .eq("id", matchId)

  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/matches")
  redirect(`/matches/${matchId}`)
}

export async function cancelMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  await supabase
    .from("matches")
    .update({ status: "cancelled" })
    .eq("id", matchId)
    .eq("creator_id", profile.id)
    .eq("status", "open")

  redirect("/matches")
}

export async function acceptMatch(matchId: string) {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/")

  // Already in a match?
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .in("status", ["open", "accepted"])
    .limit(1)

  if (existing && existing.length > 0) {
    redirect("/matches?error=already_in_match")
  }

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("status", "open")
    .single()

  if (!match) redirect("/matches")

  const needsTeam = ["2v2", "3v3", "4v4", "6v6"].includes(match.format)
  const sizeMap: Record<string, number> = { "2v2": 2, "3v3": 3, "4v4": 4, "6v6": 6 }
  let opponentTeamId = null

  if (needsTeam) {
    const neededSize = sizeMap[match.format]

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, team:teams(id, size)")
      .eq("profile_id", profile.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valid = membership?.find((m: any) => m.team?.size === neededSize)

    if (!valid) {
      redirect(`/matches/${matchId}?error=need_team`)
    }

    opponentTeamId = valid.team_id
  }

  await supabase
    .from("matches")
    .update({
      opponent_id: profile.id,
      opponent_team_id: opponentTeamId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      host_id: match.creator_id,
    })
    .eq("id", matchId)

  await createNotification({
    userId: match.creator_id,
    type: "match_accepted",
    title: "Match Accepted",
    message: `${profile.steam_name} accepted your match`,
    link: `/matches/${matchId}`,
  })

  revalidatePath(`/matches/${matchId}`)
  redirect(`/matches/${matchId}`)
}

export async function setPrivateCode(matchId: string, formData: FormData) {
  const code = formData.get("code") as string
  if (!code) return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  await supabase
    .from("matches")
    .update({ private_code: code })
    .eq("id", matchId)
    .eq("creator_id", profile.id)

  revalidatePath(`/matches/${matchId}`)
}

export async function sendMessage(matchId: string, formData: FormData) {
  const message = formData.get("message") as string
  if (!message || message.trim() === "") return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  await supabase.from("match_messages").insert({
    match_id: matchId,
    sender_id: profile.id,
    message: message.trim(),
  })

  revalidatePath(`/matches/${matchId}`)
}

export async function reportResult(matchId: string, formData: FormData) {
  const winner = formData.get("winner") as string
  if (!winner) return

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!match || match.status !== "accepted") return

  const isCreator = profile.id === match.creator_id
  const isOpponent = profile.id === match.opponent_id
  if (!isCreator && !isOpponent) return

  const updateData: { creator_report?: string; opponent_report?: string } = {}
  if (isCreator) updateData.creator_report = winner
  if (isOpponent) updateData.opponent_report = winner

  await supabase.from("matches").update(updateData).eq("id", matchId)

  const { data: updated } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (!updated) return

  const otherPlayerId = isCreator ? updated.opponent_id : updated.creator_id
  if (otherPlayerId) {
    await createNotification({
      userId: otherPlayerId,
      type: "result_reported",
      title: "Result Reported",
      message: "Your opponent submitted a result report",
      link: `/matches/${matchId}`,
    })
  }

  // Both reported
  if (updated.creator_report && updated.opponent_report) {
    if (updated.creator_report === updated.opponent_report) {
      const winnerId =
        updated.creator_report === "creator" ? updated.creator_id : updated.opponent_id
      const loserId =
        updated.creator_report === "creator" ? updated.opponent_id : updated.creator_id

      await supabase
        .from("matches")
        .update({
          status: "completed",
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", matchId)

      // Player XP
      if (winnerId) {
        await supabase.rpc("increment_xp", { profile_id: winnerId, amount: 30 })
        await supabase.rpc("increment_wins", { profile_id: winnerId })
      }
      if (loserId) {
        await supabase.rpc("increment_xp", { profile_id: loserId, amount: -20 })
        await supabase.rpc("increment_losses", { profile_id: loserId })
      }
	  
	  

      // Team W/L (for 2v2–6v6)
      const winnerTeamId =
        updated.creator_report === "creator"
          ? updated.creator_team_id
          : updated.opponent_team_id
      const loserTeamId =
        updated.creator_report === "creator"
          ? updated.opponent_team_id
          : updated.creator_team_id
		  
		  // Give every team member personal W/L (not just the captain who clicked)
async function applyTeamMemberRecords(teamId: string | null, won: boolean) {
  if (!teamId) return
  const { data: members } = await supabase
    .from("team_members")
    .select("profile_id")
    .eq("team_id", teamId)

  if (!members) return

  for (const m of members) {
    // Skip the captain already counted above if they're winnerId/loserId
    if (m.profile_id === winnerId || m.profile_id === loserId) continue
    if (won) {
      await supabase.rpc("increment_wins", { profile_id: m.profile_id })
      await supabase.rpc("increment_xp", { profile_id: m.profile_id, amount: 30 })
    } else {
      await supabase.rpc("increment_losses", { profile_id: m.profile_id })
      await supabase.rpc("increment_xp", { profile_id: m.profile_id, amount: -20 })
    }
  }
}

if (winnerTeamId) await applyTeamMemberRecords(winnerTeamId, true)
if (loserTeamId) await applyTeamMemberRecords(loserTeamId, false)

      if (winnerTeamId) {
        const { data: wt } = await supabase.from("teams").select("wins").eq("id", winnerTeamId).single()
        if (wt) {
          await supabase.from("teams").update({ wins: (wt.wins || 0) + 1 }).eq("id", winnerTeamId)
        }
      }
      if (loserTeamId) {
        const { data: lt } = await supabase.from("teams").select("losses").eq("id", loserTeamId).single()
        if (lt) {
          await supabase.from("teams").update({ losses: (lt.losses || 0) + 1 }).eq("id", loserTeamId)
        }
      }
	  
      // Ladder tracking
      if (updated.format === "1v1") {
        if (winnerId) {
          await bumpLadderEntry({ mode: "1v1", entityType: "player", entityId: winnerId, won: true })
        }
        if (loserId) {
          await bumpLadderEntry({ mode: "1v1", entityType: "player", entityId: loserId, won: false })
        }
      } else if (["2v2", "3v3", "4v4", "6v6"].includes(updated.format)) {
        if (winnerTeamId) {
          await bumpLadderEntry({ mode: updated.format, entityType: "team", entityId: winnerTeamId, won: true })
        }
        if (loserTeamId) {
          await bumpLadderEntry({ mode: updated.format, entityType: "team", entityId: loserTeamId, won: false })
        }
      }






      // Daily quests
      const today = new Date().toISOString().slice(0, 10)
      async function bumpQuest(userId: string, key: string) {
        const { data: quest } = await supabase
          .from("daily_quests")
          .select("*")
          .eq("user_id", userId)
          .eq("quest_key", key)
          .eq("quest_date", today)
          .single()

        if (quest && !quest.claimed) {
          const newProgress = Math.min(quest.progress + 1, quest.target)
          await supabase
            .from("daily_quests")
            .update({
              progress: newProgress,
              completed: newProgress >= quest.target,
            })
            .eq("id", quest.id)
        }
      }

      if (winnerId) {
        await bumpQuest(winnerId, "play_2")
        await bumpQuest(winnerId, "win_1")
        await bumpQuest(winnerId, "win_2")
      }
      if (loserId) {
        await bumpQuest(loserId, "play_2")
      }
    } else {
      await supabase
        .from("matches")
        .update({ status: "disputed" })
        .eq("id", matchId)
    }
  }

  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/profile")
  revalidatePath("/quests")
  revalidatePath("/teams")
  revalidatePath("/ladders")
}