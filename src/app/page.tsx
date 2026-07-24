export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ loggedin?: string; name?: string }>
}) {
  const params = await searchParams
  const isLoggedIn = params.loggedin === "1"
  const steamName = params.name || null

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-200">
      <nav className="border-b border-[#1c1c28] bg-[#050508]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] flex items-center justify-center font-bold text-black text-sm">
              C
            </div>
            <span className="font-bold text-xl tracking-wide">CITADEL</span>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && steamName ? (
              <>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Match Finder</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Ladder</a>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-medium">{steamName}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#FF5C00]/20 text-[#FF5C00] font-medium">
                    Unranked
                  </span>
                </div>
              </>
            ) : (
              <a href="/api/steam/login" className="btn-primary px-5 py-2 rounded-lg text-sm">
                Login with Steam
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {isLoggedIn && steamName ? (
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {steamName}</h1>
            <p className="text-gray-400 mb-10">You are logged in. Rank system and matches coming next.</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-2 text-[#FF5C00]">Create XP Match</h2>
                <p className="text-sm text-gray-400 mb-4">Post a free XP match for others to accept.</p>
                <button className="btn-primary px-4 py-2 rounded-lg text-sm" disabled>
                  Coming next
                </button>
              </div>

              <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-2 text-purple-400">Open Matches</h2>
                <p className="text-sm text-gray-400 mb-4">Accept matches posted by other players.</p>
                <button className="px-4 py-2 rounded-lg text-sm border border-[#1c1c28]" disabled>
                  Coming next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center pt-12">
            <h1 className="text-5xl font-extrabold mb-6">
              COMPETE FOR<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]">
                GLORY
              </span>
            </h1>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              XP matches and ladders for Deadlock. Login with Steam to get started.
            </p>
            <a href="/api/steam/login" className="btn-primary px-8 py-3.5 rounded-xl inline-block">
              Login with Steam
            </a>
          </div>
        )}
      </main>
    </div>
  )
}