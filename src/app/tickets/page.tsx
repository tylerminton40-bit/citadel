import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

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

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Tickets</h1>
            <p className="text-gray-400 text-sm mt-1">
              Submit reports and dispute evidence
            </p>
          </div>
          <Link href="/tickets/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
            + New Ticket
          </Link>
        </div>

        <div className="space-y-4">
          {tickets && tickets.length > 0 ? (
            tickets.map((ticket: {
  id: string
  subject: string
  created_at: string
  status: string
}) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 hover:border-[#FF5C00]/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    ticket.status === "open" ? "bg-yellow-500/15 text-yellow-400" :
                    ticket.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                    "bg-gray-500/15 text-gray-400"
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-gray-500">
              No tickets yet. Create one if you need help with a dispute.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}