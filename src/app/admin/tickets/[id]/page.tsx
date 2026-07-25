import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { resolveTicket } from "./actions"

const ADMIN_STEAM_ID = "76561199480856629"

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value

  if (steamId !== ADMIN_STEAM_ID) {
    redirect("/")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, creator:profiles(steam_name, avatar_url, steam_id)")
    .eq("id", id)
    .single()

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#08080d] text-gray-200">
        <Navbar />
        <div className="text-center py-32 text-gray-500">Ticket not found</div>
      </div>
    )
  }

  const { data: proofs } = await supabase
    .from("ticket_proofs")
    .select("*")
    .eq("ticket_id", id)

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/admin/tickets" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to all tickets
        </Link>

        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              ticket.status === "open" ? "bg-yellow-500/15 text-yellow-400" :
              ticket.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
              "bg-gray-500/15 text-gray-400"
            }`}>
              {ticket.status}
            </span>
          </div>

          <div className="text-sm text-gray-400 mb-4">
            From: <span className="text-white">{ticket.creator?.steam_name}</span> • {new Date(ticket.created_at).toLocaleString()}
          </div>

          {ticket.notes && (
            <div className="bg-[#08080d] rounded-xl p-4 text-sm mb-6">
              {ticket.notes}
            </div>
          )}

          {/* Proofs */}
          <h3 className="font-bold mb-3">Proof</h3>
          <div className="space-y-4">
            {proofs && proofs.length > 0 ? (
              proofs.map((proof: {
  id: string
  file_url: string
  file_type: string
}) => (
                <div key={proof.id} className="bg-[#08080d] rounded-xl p-4">
                  {proof.file_type === "video" ? (
                    <video src={proof.file_url} controls className="w-full rounded-lg" />
                  ) : (
                    <img src={proof.file_url} alt="Proof" className="w-full rounded-lg" />
                  )}
                  <a href={proof.file_url} target="_blank" className="text-xs text-[#FF5C00] mt-2 inline-block">
                    Open full size →
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No proof uploaded</p>
            )}
          </div>
        </div>

        {/* Admin Response */}
        {ticket.status !== "resolved" && (
          <form action={resolveTicket.bind(null, id)} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold">Respond & Resolve</h3>
            <textarea
              name="response"
              rows={3}
              placeholder="Your response to the player..."
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
            <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              Mark as Resolved
            </button>
          </form>
        )}

        {ticket.admin_response && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mt-6">
            <h3 className="font-bold text-emerald-400 mb-2">Your Response</h3>
            <p className="text-sm">{ticket.admin_response}</p>
          </div>
        )}
      </main>
    </div>
  )
}