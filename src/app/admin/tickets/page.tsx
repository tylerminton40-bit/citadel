import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

const ADMIN_STEAM_ID = "76561199480856629"

export default async function AdminTicketsPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  // Only you can access this page
  if (steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, creator:profiles(steam_name, avatar_url)")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Admin • Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">Only you can see this page</p>
        </div>

        <div className="space-y-4">
          {tickets && tickets.length > 0 ? (
            tickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 hover:border-[#FF5C00]/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {ticket.creator?.avatar_url && (
                      <img src={ticket.creator.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-sm text-gray-400">
                        {ticket.creator?.steam_name} • {new Date(ticket.created_at).toLocaleString()}
                      </div>
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
            <div className="text-center py-20 text-gray-500">No tickets yet</div>
          )}
        </div>
      </main>
    </div>
  )
}