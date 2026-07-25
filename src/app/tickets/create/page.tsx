import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createTicket } from "./actions"

export default async function CreateTicketPage() {
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

  // Block if they already have an open ticket
  const { data: existing } = await supabase
    .from("tickets")
    .select("id")
    .eq("creator_id", profile.id)
    .eq("status", "open")
    .limit(1)

  if (existing && existing.length > 0) {
    redirect("/tickets?error=already_open")
  }

  // Get their matches so they can choose which one
  const { data: matches } = await supabase
    .from("matches")
    .select("id, format, best_of, status, created_at, creator:profiles!matches_creator_id_fkey(steam_name), opponent:profiles!matches_opponent_id_fkey(steam_name)")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">New Ticket</h1>
        <p className="text-gray-400 text-sm mb-8">
          You must upload at least 1 screenshot or video as proof.
        </p>

        <form action={createTicket} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Related Match</label>
            <select
              name="match_id"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            >
              <option value="">No specific match</option>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
{matches?.map((m: any) => (
  <option key={m.id} value={m.id}>
    {m.format} {m.best_of} • {m.status} • {m.creator?.steam_name || "?"} vs {m.opponent?.steam_name || "?"}
  </option>
))}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <input
              name="subject"
              required
              placeholder="e.g. Dispute - opponent reported wrong winner"
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes / Explanation</label>
            <textarea
              name="notes"
              rows={4}
              placeholder="Explain what happened..."
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Proof (Screenshot or Video) *
            </label>
            <input
              name="proof"
              type="file"
              accept="image/*,video/*"
              required
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#FF5C00] file:text-black file:font-medium"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Submit Ticket
          </button>
        </form>
      </main>
    </div>
  )
}