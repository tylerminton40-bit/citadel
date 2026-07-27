"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { DRAFT_STEPS, type DraftState } from "@/lib/deadlock-heroes"

export async function draftSelect(scrimId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const heroId = formData.get("hero_id") as string
  if (!heroId) return

  const { data: scrim } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .eq("status", "drafting")
    .single()

  if (!scrim) redirect(`/scrims/${scrimId}`)

  const isCreatorCap = profile.id === scrim.creator_id
  const isOppCap = profile.id === scrim.opponent_captain_id
  if (!isCreatorCap && !isOppCap) redirect(`/scrims/${scrimId}`)

  const myTeamId = isCreatorCap ? scrim.creator_team_id : scrim.opponent_team_id
  const state = (scrim.draft_state || {}) as DraftState

  if (state.phase === "done") redirect(`/scrims/${scrimId}`)
  if (state.turn_team_id && state.turn_team_id !== myTeamId) {
    redirect(`/scrims/${scrimId}`)
  }

  const taken = new Set([
    ...(state.bans || []).map((b) => b.heroId),
    ...(state.picks || []).map((p) => p.heroId),
  ])
  if (taken.has(heroId)) redirect(`/scrims/${scrimId}`)

  const stepIndex = state.step ?? 0
  const step = DRAFT_STEPS[stepIndex]
  if (!step) redirect(`/scrims/${scrimId}`)

  const firstBanId = scrim.first_ban_team_id
  const otherId =
    firstBanId === scrim.creator_team_id
      ? scrim.opponent_team_id
      : scrim.creator_team_id

  const expectedTeam = step.side === "first_ban" ? firstBanId : otherId
  if (myTeamId !== expectedTeam) redirect(`/scrims/${scrimId}`)

  const bans = [...(state.bans || [])]
  const picks = [...(state.picks || [])]

  if (step.type === "ban") {
    bans.push({ heroId, teamId: myTeamId })
  } else {
    picks.push({ heroId, teamId: myTeamId })
  }

  let withinStep = (state.withinStep || 0) + 1
  let nextStep = stepIndex
  let phase: DraftState["phase"] = step.type
  let turn_team_id: string | null = myTeamId

  if (withinStep >= step.count) {
    withinStep = 0
    nextStep = stepIndex + 1
    if (nextStep >= DRAFT_STEPS.length) {
      phase = "done"
      turn_team_id = null
    } else {
      const ns = DRAFT_STEPS[nextStep]
      phase = ns.type
      turn_team_id = ns.side === "first_ban" ? firstBanId : otherId
    }
  }

  const newState: DraftState = {
    step: nextStep >= DRAFT_STEPS.length ? stepIndex : nextStep,
    withinStep,
    bans,
    picks,
    phase,
    turn_team_id,
  }

  const patch: Record<string, unknown> = { draft_state: newState }
  if (phase === "done") {
    patch.status = "live"
  }

  await supabase.from("scrims").update(patch).eq("id", scrimId)

  revalidatePath(`/scrims/${scrimId}`)
  redirect(`/scrims/${scrimId}`)
}

async function getProfile() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/login?next=/scrims")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) redirect("/login?next=/scrims")
  return { supabase, profile }
}

export async function createScrim(formData: FormData) {
  const { supabase, profile } = await getProfile()

  const teamId = formData.get("team_id") as string
  const visibilityRaw = (formData.get("visibility") as string) || "open"
  const visibility = visibilityRaw === "private" ? "private" : "open"

  const schedDate = (formData.get("sched_date") as string) || ""
  const schedHour = formData.get("sched_hour") as string
  const schedMinute = (formData.get("sched_minute") as string) || "00"

  let scheduled_at: string | null = null
  if (schedDate) {
    const h = parseInt(schedHour || "0", 10)
    const m = parseInt(schedMinute, 10)
    const local = new Date(
      parseInt(schedDate.slice(0, 4), 10),
      parseInt(schedDate.slice(5, 7), 10) - 1,
      parseInt(schedDate.slice(8, 10), 10),
      h,
      m,
      0
    )
    scheduled_at = local.toISOString()
  }

  if (!teamId) redirect("/scrims/create?error=team")

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, team:teams(*)")
    .eq("profile_id", profile.id)
    .eq("team_id", teamId)
    .single()

  const team = membership?.team
    ? Array.isArray(membership.team)
      ? membership.team[0]
      : membership.team
    : null

  if (!team || !team.is_scrim) {
    redirect("/scrims/create?error=not_scrim")
  }

  const { data: busy } = await supabase
    .from("scrims")
    .select("id")
    .or(`creator_team_id.eq.${teamId},opponent_team_id.eq.${teamId}`)
    .in("status", ["open", "accepted", "choosing", "drafting", "live"])
    .limit(1)

  if (busy && busy.length > 0) {
    redirect("/scrims?error=team_busy")
  }

  const { data: scrim, error } = await supabase
    .from("scrims")
    .insert({
      creator_id: profile.id,
      creator_team_id: teamId,
      visibility,
      status: "open",
      scheduled_at,
    })
    .select()
    .single()

  if (error || !scrim) {
    redirect("/scrims/create?error=failed")
  }

  revalidatePath("/scrims")
  redirect(`/scrims/${scrim.id}`)
}

export async function cancelScrim(scrimId: string) {
  const { supabase, profile } = await getProfile()

  await supabase
    .from("scrims")
    .update({ status: "cancelled" })
    .eq("id", scrimId)
    .eq("creator_id", profile.id)
    .eq("status", "open")

  revalidatePath("/scrims")
  redirect("/scrims")
}

export async function acceptScrim(scrimId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const teamId = formData.get("team_id") as string

  if (!teamId) redirect(`/scrims/${scrimId}?error=team`)

  const { data: scrim } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .eq("status", "open")
    .single()

  if (!scrim) redirect("/scrims")

  if (scrim.creator_team_id === teamId) {
    redirect(`/scrims/${scrimId}?error=own_team`)
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team:teams(*)")
    .eq("profile_id", profile.id)
    .eq("team_id", teamId)
    .single()

  const team = membership?.team
    ? Array.isArray(membership.team)
      ? membership.team[0]
      : membership.team
    : null

  if (!team || !team.is_scrim) {
    redirect(`/scrims/${scrimId}?error=not_scrim`)
  }

  const { data: busy } = await supabase
    .from("scrims")
    .select("id")
    .or(`creator_team_id.eq.${teamId},opponent_team_id.eq.${teamId}`)
    .in("status", ["open", "accepted", "drafting", "live"])
    .limit(1)

  if (busy && busy.length > 0) {
    redirect(`/scrims/${scrimId}?error=team_busy`)
  }

  const talkEnds = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase
    .from("scrims")
    .update({
      opponent_team_id: teamId,
      opponent_captain_id: profile.id,
      status: "accepted",
      talk_ends_at: talkEnds,
      creator_ready: false,
      opponent_ready: false,
    })
    .eq("id", scrimId)

  revalidatePath(`/scrims/${scrimId}`)
  redirect(`/scrims/${scrimId}`)
}

export async function setCaptainReady(scrimId: string) {
  const { supabase, profile } = await getProfile()

  const { data: scrim } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .eq("status", "accepted")
    .single()

  if (!scrim) redirect(`/scrims/${scrimId}`)

  const isCreator = profile.id === scrim.creator_id
  const isOpponent = profile.id === scrim.opponent_captain_id
  if (!isCreator && !isOpponent) redirect(`/scrims/${scrimId}`)

  const patch = isCreator
    ? { creator_ready: true }
    : { opponent_ready: true }

  await supabase.from("scrims").update(patch).eq("id", scrimId)

  const { data: updated } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .single()

  // Both ready → move to choosing host / first ban (opponent captain chooses)
  if (updated?.creator_ready && updated?.opponent_ready) {
    await supabase
      .from("scrims")
      .update({ status: "choosing" })
      .eq("id", scrimId)
  }

  revalidatePath(`/scrims/${scrimId}`)
  redirect(`/scrims/${scrimId}`)
}

export async function chooseHostOrFirstBan(scrimId: string, formData: FormData) {
  const { supabase, profile } = await getProfile()
  const choice = formData.get("choice") as string // "host" | "first_ban"

  const { data: scrim } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .eq("status", "choosing")
    .single()

  if (!scrim) redirect(`/scrims/${scrimId}`)

  // Accepting captain chooses
  if (profile.id !== scrim.opponent_captain_id) {
    redirect(`/scrims/${scrimId}`)
  }

  let host_team_id = scrim.creator_team_id
  let first_ban_team_id = scrim.opponent_team_id

  if (choice === "host") {
    host_team_id = scrim.opponent_team_id
    first_ban_team_id = scrim.creator_team_id
  } else {
    // first_ban
    host_team_id = scrim.creator_team_id
    first_ban_team_id = scrim.opponent_team_id
  }

  await supabase
    .from("scrims")
    .update({
      host_team_id,
      first_ban_team_id,
      status: "drafting",
      draft_state: {
  step: 0,
  withinStep: 0,
  bans: [],
  picks: [],
  phase: "ban",
  turn_team_id: first_ban_team_id,
},
    })
    .eq("id", scrimId)

  revalidatePath(`/scrims/${scrimId}`)
  redirect(`/scrims/${scrimId}`)
}