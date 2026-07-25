import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { closeTicket } from "../actions"

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .eq("creator_id", profile.id)
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

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/tickets" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
          ← Back to tickets
        </Link>

        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
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
            {new Date(ticket.created_at).toLocaleString()}
          </div>

          {ticket.notes && (
            <div className="bg-[#08080d] rounded-xl p-4 text-sm mb-6">
              {ticket.notes}
            </div>
          )}

          <h3 className="font-bold mb-3">Your Proof</h3>
          <div className="space-y-4 mb-6">
            {proofs && proofs.length > 0 ? (
              proofs.map((proof: { id: string; file_url: string; file_type: string }) => (
                <div key={proof.id} className="bg-[#08080d] rounded-xl p-4">
                  {proof.file_type === "video" ? (
                    <video src={proof.file_url} controls className="w-full rounded-lg" />
                  ) : (
                    <img src={proof.file_url} alt="Proof" className="w-full rounded-lg" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No proof</p>
            )}
          </div>

{ticket.status === "open" && (
  <form action={async () => {
    "use server"
    await closeTicket(id)
  }} className="mt-6">
    <button type="submit" className="px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition">
      Close Ticket
    </button>
  </form>
)}

          {ticket.admin_response && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <h3 className="font-bold text-emerald-400 mb-2">Admin Response</h3>
              <p className="text-sm">{ticket.admin_response}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}