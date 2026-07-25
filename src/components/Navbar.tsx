import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { getRank } from "@/lib/ranks"
import NavbarClient from "./NavbarClient"

export default async function Navbar() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  let profile = null
  let rank = null

  if (steamId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from("profiles")
      .select("id, steam_name, avatar_url, xp")
      .eq("steam_id", steamId)
      .single()
    profile = data
    if (profile) rank = getRank(profile.xp || 0)
  }

  return <NavbarClient profile={profile} rank={rank} />
}