import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("scrims")
    .select(`
      id, status, visibility, scheduled_at, talk_ends_at,
      creator_ready, opponent_ready,
      host_team_id, first_ban_team_id, draft_state, private_code,
      creator_id, opponent_captain_id, creator_team_id, opponent_team_id,
      creator_report, opponent_report
    `)
    .eq("id", id)
    .single()

  return NextResponse.json(data || {})
}