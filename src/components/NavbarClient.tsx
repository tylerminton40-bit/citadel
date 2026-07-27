"use client"

import Link from "next/link"
import { useState } from "react"
import Notifications from "@/components/Notifications"

type Profile = {
  id: string
  steam_name: string
  avatar_url: string | null
  xp: number
}

type Rank = {
  name: string
  bg: string
  color: string
}

export default function NavbarClient({
  profile,
  rank,
}: {
  profile: Profile | null
  rank: Rank | null
}) {
  const [open, setOpen] = useState(false)

const links = [
{ href: "/scrims", label: "Scrims" },
  { href: "/ranks", label: "Ranks" },
  { href: "/matches", label: "Match Finder" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/quests", label: "Quests" },
  { href: "/tickets", label: "Tickets" },
  { href: "/rules", label: "Rules" },
  { href: "/ladders", label: "Ladders" },
]

  return (
    <nav className="border-b border-[#1c1c28] bg-[#050508]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5C00] to-[#FF8A00] flex items-center justify-center font-bold text-black text-sm">
            C
          </div>
          <span className="font-bold text-lg tracking-wide">CITADEL</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition">
              {l.label}
            </Link>
          ))}

          {profile ? (
            <div className="flex items-center gap-3 ml-2">
              <Notifications userId={profile.id} />
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                {profile.avatar_url && (
                  <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                )}
                <span className="text-sm font-medium">{profile.steam_name}</span>
                {rank && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${rank.bg} ${rank.color}`}>
                    {rank.name}
                  </span>
                )}
              </Link>
              <Link href="/settings" className="text-sm text-gray-400 hover:text-white">
                Settings
              </Link>
            </div>
          ) : (
            <a href="/api/steam/login" className="btn-primary px-4 py-1.5 rounded-lg text-sm">
              Login
            </a>
          )}
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          {profile && <Notifications userId={profile.id} />}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Menu"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[#1c1c28] bg-[#08080d] px-4 py-4 space-y-1">
          {profile && (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#111118] mb-3"
            >
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
              )}
              <div>
                <div className="font-medium text-sm">{profile.steam_name}</div>
                {rank && (
                  <div className={`text-xs ${rank.color}`}>{rank.name}</div>
                )}
              </div>
            </Link>
          )}

          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-[#111118] transition"
            >
              {l.label}
            </Link>
          ))}

          {profile ? (
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-[#111118] transition"
            >
              Settings
            </Link>
          ) : (
            <a
              href="/api/steam/login"
              className="block mt-3 btn-primary text-center py-2.5 rounded-xl text-sm"
            >
              Login with Steam
            </a>
          )}
        </div>
      )}
    </nav>
  )
}