import Navbar from "@/components/Navbar"
import Link from "next/link"
import PlayerSearch from "@/components/PlayerSearchBar"

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Find a Player</h1>
          <p className="text-gray-400 text-sm">
            Search by Steam name
          </p>
        </div>

        <PlayerSearch />

        <div className="text-center mt-10">
          <Link href="/leaderboard" className="text-sm text-gray-500 hover:text-[#FF5C00] transition">
            View full leaderboard →
          </Link>
        </div>
      </main>
    </div>
  )
}