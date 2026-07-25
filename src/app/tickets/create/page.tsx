import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createTicket } from "./actions"

export default async function CreateTicketPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

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
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <input
              name="subject"
              required
              placeholder="e.g. Dispute on match - opponent lied"
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