import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createMatch } from "./actions"

export default async function CreateMatchPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Create XP Match</h1>

        <form action={createMatch} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
          {/* Format */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Format</label>
            <select
              name="format"
              required
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            >
              <option value="1v1">1v1 (Street Brawl)</option>
              <option value="2v2">2v2 (Street Brawl)</option>
              <option value="3v3">3v3 (Street Brawl)</option>
              <option value="4v4">4v4 (Street Brawl)</option>
              <option value="6v6">6v6 (Normal)</option>
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Region</label>
            <select
              name="region"
              required
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            >
              <option value="NA East">NA East</option>
              <option value="NA West">NA West</option>
              <option value="EU">EU</option>
              <option value="Asia">Asia</option>
              <option value="SA">South America</option>
              <option value="OCE">Oceania</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes (optional)</label>
            <input
              name="notes"
              type="text"
              placeholder="Any extra rules or info..."
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
            Post Match
          </button>
        </form>
      </main>
    </div>
  )
}