import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { DRAFT_STEPS, type DraftState } from "@/lib/deadlock-heroes"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const action = body.action as string

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) return NextResponse.json({ error: "auth" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, steam_name")
    .eq("steam_id", steamId)
    .single()

  if (!profile) return NextResponse.json({ error: "auth" }, { status: 401 })

  const { data: scrim } = await supabase.from("scrims").select("*").eq("id", id).single()
  if (!scrim) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const isCreator = profile.id === scrim.creator_id
  const isOppCap = profile.id === scrim.opponent_captain_id

  // ---- READY ----
  if (action === "ready") {
    if (scrim.status !== "accepted") return NextResponse.json({ error: "status" }, { status: 400 })
    if (!isCreator && !isOppCap) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const patch = isCreator ? { creator_ready: true } : { opponent_ready: true }
    await supabase.from("scrims").update(patch).eq("id", id)

    const { data: updated } = await supabase.from("scrims").select("*").eq("id", id).single()
    if (updated?.creator_ready && updated?.opponent_ready) {
      await supabase.from("scrims").update({ status: "choosing" }).eq("id", id)
    }

    const { data: final } = await supabase.from("scrims").select("*").eq("id", id).single()
    return NextResponse.json(final)
  }

  // ---- CHOOSE HOST / FIRST BAN ----
  if (action === "choose") {
    if (scrim.status !== "choosing") return NextResponse.json({ error: "status" }, { status: 400 })
    if (!isOppCap) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const choice = body.choice as string // host | first_ban
    let host_team_id = scrim.creator_team_id
    let first_ban_team_id = scrim.opponent_team_id

    if (choice === "host") {
      host_team_id = scrim.opponent_team_id
      first_ban_team_id = scrim.creator_team_id
    } else {
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
      .eq("id", id)

    const { data: final } = await supabase.from("scrims").select("*").eq("id", id).single()
    return NextResponse.json(final)
  }

  // ---- DRAFT SELECT ----
  if (action === "draft") {
    if (scrim.status !== "drafting") return NextResponse.json({ error: "status" }, { status: 400 })
    if (!isCreator && !isOppCap) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const heroId = body.hero_id as string
    if (!heroId) return NextResponse.json({ error: "hero" }, { status: 400 })

    const myTeamId = isCreator ? scrim.creator_team_id : scrim.opponent_team_id
    const state = (scrim.draft_state || {}) as DraftState

    if (state.phase === "done") return NextResponse.json(scrim)
    if (state.turn_team_id && state.turn_team_id !== myTeamId) {
      return NextResponse.json({ error: "not_turn" }, { status: 400 })
    }

    const taken = new Set([
      ...(state.bans || []).map((b) => b.heroId),
      ...(state.picks || []).map((p) => p.heroId),
    ])
    if (taken.has(heroId)) return NextResponse.json({ error: "taken" }, { status: 400 })

    const stepIndex = state.step ?? 0
    const step = DRAFT_STEPS[stepIndex]
    if (!step) return NextResponse.json({ error: "done" }, { status: 400 })

    const firstBanId = scrim.first_ban_team_id
    const otherId =
      firstBanId === scrim.creator_team_id ? scrim.opponent_team_id : scrim.creator_team_id
    const expectedTeam = step.side === "first_ban" ? firstBanId : otherId
    if (myTeamId !== expectedTeam) return NextResponse.json({ error: "not_turn" }, { status: 400 })

    const bans = [...(state.bans || [])]
    const picks = [...(state.picks || [])]
    if (step.type === "ban") bans.push({ heroId, teamId: myTeamId })
    else picks.push({ heroId, teamId: myTeamId })

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
    if (phase === "done") patch.status = "live"

    await supabase.from("scrims").update(patch).eq("id", id)
    const { data: final } = await supabase.from("scrims").select("*").eq("id", id).single()
    return NextResponse.json(final)
  }

  // ---- POST CODE ----
  if (action === "code") {
    if (!["live", "drafting"].includes(scrim.status)) {
      return NextResponse.json({ error: "status" }, { status: 400 })
    }
    if (!isCreator && !isOppCap) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    // Only host captain posts code
    const hostTeam = scrim.host_team_id
    const myTeam = isCreator ? scrim.creator_team_id : scrim.opponent_team_id
    if (myTeam !== hostTeam) {
      return NextResponse.json({ error: "not_host" }, { status: 403 })
    }
    const code = (body.code as string)?.trim()
    if (!code) return NextResponse.json({ error: "code" }, { status: 400 })
    await supabase.from("scrims").update({ private_code: code }).eq("id", id)
    const { data: final } = await supabase.from("scrims").select("*").eq("id", id).single()
    return NextResponse.json(final)
  }

  // ---- REPORT ----
  if (action === "report") {
    if (scrim.status !== "live") {
      return NextResponse.json({ error: "status" }, { status: 400 })
    }
    if (!isCreator && !isOppCap) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const winner = body.winner as string // "creator" | "opponent"
    if (winner !== "creator" && winner !== "opponent") {
      return NextResponse.json({ error: "winner" }, { status: 400 })
    }

    const patch: Record<string, string> = {}
    if (isCreator) patch.creator_report = winner
    if (isOppCap) patch.opponent_report = winner
    await supabase.from("scrims").update(patch).eq("id", id)

    const { data: updated } = await supabase.from("scrims").select("*").eq("id", id).single()
    if (!updated) return NextResponse.json({ error: "fail" }, { status: 500 })

    if (updated.creator_report && updated.opponent_report) {
      if (updated.creator_report === updated.opponent_report) {
        const winnerTeamId =
          updated.creator_report === "creator"
            ? updated.creator_team_id
            : updated.opponent_team_id
        const loserTeamId =
          updated.creator_report === "creator"
            ? updated.opponent_team_id
            : updated.creator_team_id

        await supabase
          .from("scrims")
          .update({
            status: "completed",
            winner_team_id: winnerTeamId,
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)

        // Team W/L
        if (winnerTeamId) {
          const { data: wt } = await supabase.from("teams").select("wins").eq("id", winnerTeamId).single()
          if (wt) await supabase.from("teams").update({ wins: (wt.wins || 0) + 1 }).eq("id", winnerTeamId)
        }
        if (loserTeamId) {
          const { data: lt } = await supabase.from("teams").select("losses").eq("id", loserTeamId).single()
          if (lt) await supabase.from("teams").update({ losses: (lt.losses || 0) + 1 }).eq("id", loserTeamId)
        }

        // All members +60 / -40 XP
        async function bumpTeam(teamId: string | null, won: boolean) {
          if (!teamId) return
          const { data: mems } = await supabase
            .from("team_members")
            .select("profile_id")
            .eq("team_id", teamId)
          for (const m of mems || []) {
            if (won) {
              await supabase.rpc("increment_xp", { profile_id: m.profile_id, amount: 60 })
              await supabase.rpc("increment_wins", { profile_id: m.profile_id })
            } else {
              await supabase.rpc("increment_xp", { profile_id: m.profile_id, amount: -40 })
              await supabase.rpc("increment_losses", { profile_id: m.profile_id })
            }
          }
        }
        await bumpTeam(winnerTeamId, true)
        await bumpTeam(loserTeamId, false)
      } else {
        await supabase.from("scrims").update({ status: "disputed" }).eq("id", id)
      }
    }

    const { data: final } = await supabase.from("scrims").select("*").eq("id", id).single()
    return NextResponse.json(final)
  }
  
  return NextResponse.json({ error: "unknown" }, { status: 400 })
}