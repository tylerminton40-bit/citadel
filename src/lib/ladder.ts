import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getCurrentSeason() {
  const supabase = getSupabase()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: existing } = await supabase
    .from("ladder_seasons")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle()

  if (existing) return existing

  const { data: created } = await supabase
    .from("ladder_seasons")
    .insert({ year, month, status: "active" })
    .select()
    .single()

  return created
}

export async function bumpLadderEntry(opts: {
  mode: string
  entityType: "player" | "team"
  entityId: string
  won: boolean
}) {
  const supabase = getSupabase()
  const season = await getCurrentSeason()
  if (!season) return

  const { data: entry } = await supabase
    .from("ladder_entries")
    .select("*")
    .eq("season_id", season.id)
    .eq("mode", opts.mode)
    .eq("entity_type", opts.entityType)
    .eq("entity_id", opts.entityId)
    .maybeSingle()

  if (entry) {
    await supabase
      .from("ladder_entries")
      .update({
        wins: opts.won ? entry.wins + 1 : entry.wins,
        losses: opts.won ? entry.losses : entry.losses + 1,
      })
      .eq("id", entry.id)
  } else {
    await supabase.from("ladder_entries").insert({
      season_id: season.id,
      mode: opts.mode,
      entity_type: opts.entityType,
      entity_id: opts.entityId,
      wins: opts.won ? 1 : 0,
      losses: opts.won ? 0 : 1,
    })
  }
}