import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const steamId = cookieStore.get("citadel_steam_id")?.value
  if (!steamId) redirect("/")

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-4">
          <a
            href="/api/logout"
            className="block w-full text-center py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition font-medium"
          >
            Logout
          </a>
        </div>
      </main>
    </div>
  )
}