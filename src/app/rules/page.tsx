import Navbar from "@/components/Navbar"
import Link from "next/link"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Citadel Rules</h1>
        <p className="text-gray-400 mb-12">
          How matches, reporting, and disputes work.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-[#FF5C00] mb-3">1. Match Formats</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>1v1, 2v2, 3v3, 4v4 → Street Brawl only</li>
              <li>6v6 → Normal mode</li>
              <li>Best of 1 / 3 / 5 / 7 is chosen when the match is created</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#FF5C00] mb-3">2. How to Play a Match</h2>
            <ol className="text-gray-400 space-y-2 text-sm list-decimal list-inside">
              <li>One player creates a match on Citadel</li>
              <li>Another player accepts it</li>
              <li>Host creates a Private Match in Deadlock and posts the code</li>
              <li>Both players join and play</li>
              <li>Both players report the result on the match page</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#FF5C00] mb-3">3. Reporting Results</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>Both players must report who won</li>
              <li>If both reports match → match is completed and XP is awarded</li>
              <li>If reports disagree → match becomes <strong className="text-red-400">Disputed</strong></li>
              <li>Win = +30 XP • Loss = +10 XP</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#FF5C00] mb-3">4. Disputes & Tickets</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>If a match is disputed, open a Ticket and upload proof (screenshot or video)</li>
              <li>You can only have 1 open ticket at a time</li>
              <li>Admin reviews proof and can force the correct winner</li>
              <li>False reports or fake proof can result in penalties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#FF5C00] mb-3">5. Conduct</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>No smurfing / account boosting</li>
              <li>No throwing or intentional feeding</li>
              <li>Be respectful in match chat</li>
              <li>Host is the Hidden King — they control the lobby code</li>
            </ul>
          </section>
        </div>

        <div className="mt-16 text-center">
          <Link href="/matches" className="btn-primary px-8 py-3 rounded-xl inline-block">
            Find a Match
          </Link>
        </div>
      </main>
    </div>
  )
}