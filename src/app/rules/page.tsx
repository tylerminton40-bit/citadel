import Navbar from "@/components/Navbar"
import Link from "next/link"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Citadel Rules</h1>
        <p className="text-gray-400 mb-10 text-sm">
          Matches, teams, reporting, and disputes.
        </p>

        <div className="space-y-8">
          {/* 1 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">1. Match Formats</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li><strong className="text-white">Street Brawl</strong> — 1v1, 2v2, 3v3, 4v4, 6v6</li>
              <li><strong className="text-white">Normal</strong> — 1v1, 2v2, 3v3, 4v4, 6v6</li>
              <li>Best of 1 / 3 / 5 / 7 chosen when creating the match</li>
              <li><strong className="text-white">Normal 1v1–3v3 special rules:</strong> No Urn (decays instantly), No Rift (never spawns)</li>
            </ul>
          </section>

          {/* 2 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">2. Teams</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>You can own <strong className="text-white">one team per mode</strong> (2v2, 3v3, 4v4, 6v6)</li>
              <li><strong className="text-white">2v2–6v6 matches require a team</strong> of that size to create or accept</li>
              <li>1v1 is always solo — no team needed</li>
              <li>Invite players by exact Steam name from the Teams page</li>
              <li>Team wins/losses are tracked for the ladder</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">3. How to Play</h2>
            <ol className="text-gray-400 space-y-2 text-sm list-decimal list-inside">
              <li>Create or accept a match on Citadel</li>
              <li>Host posts the private match / connect code</li>
              <li>
                <strong className="text-white">Normal 1v1–3v3:</strong> host uses console steps
                (<code className="text-[#FF5C00] text-xs">map dl_midtown</code>, pause commands, then unpause with P)
              </li>
              <li>
                <strong className="text-white">Street Brawl / other:</strong> standard private match lobby
              </li>
              <li>Play the series, then both players report the result</li>
            </ol>
          </section>

          {/* 4 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">4. Reporting & XP</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>Both players must report who won</li>
              <li>If both agree → match completes, XP is awarded</li>
              <li>If reports disagree → match becomes <strong className="text-red-400">Disputed</strong></li>
              <li>
                <span className="text-emerald-400 font-medium">+30 XP</span> on win ·{" "}
                <span className="text-red-400 font-medium">−20 XP</span> on loss
              </li>
              <li>Team matches also update the team’s win/loss record</li>
            </ul>
          </section>

          {/* 5 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">5. Disputes & Tickets</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>Open a Ticket and upload proof (screenshot or video required)</li>
              <li>You can only have <strong className="text-white">1 open ticket</strong> at a time</li>
              <li>Link the disputed match when creating the ticket</li>
              <li>Admin reviews proof and can force the correct winner + fix XP</li>
              <li>False reports or fake proof can result in penalties</li>
            </ul>
          </section>

          {/* 6 */}
          <section className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#FF5C00] mb-3">6. Conduct</h2>
            <ul className="text-gray-400 space-y-2 text-sm list-disc list-inside">
              <li>No smurfing or account boosting</li>
              <li>No throwing or intentional feeding</li>
              <li>Be respectful in match chat</li>
              <li>Host is the <strong className="text-[#FF5C00]">Hidden King</strong> — they control the lobby code</li>
              <li>Challenger is the <strong className="text-purple-400">Archmother</strong></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/matches" className="btn-primary px-8 py-3 rounded-xl inline-block text-sm">
            Find a Match
          </Link>
        </div>
      </main>
    </div>
  )
}