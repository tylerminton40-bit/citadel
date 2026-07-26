"use client"

import { useState } from "react"
import { createMatch } from "@/app/matches/create/actions"

type Team = {
  id: string
  name: string
  tag: string | null
  size: number
}

export default function CreateMatchForm({ teams }: { teams: Team[] }) {
  const [format, setFormat] = useState("1v1")

  const sizeMap: Record<string, number> = {
    "1v1": 0,
    "2v2": 2,
    "3v3": 3,
    "4v4": 4,
    "6v6": 6,
  }

  const neededSize = sizeMap[format]
  const matchingTeams = teams.filter((t) => t.size === neededSize)
  const needsTeam = neededSize > 0

  return (
    <form action={createMatch} className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6 space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Category</label>
        <select name="ruleset" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
  <option value="Street Brawl">Street Brawl</option>
  <option value="Street Brawl - Random">Street Brawl - Random</option>
  <option value="Normal">Normal</option>
  <option value="Normal - Random Character">Normal - Random Character</option>
</select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Format</label>
        <select
          name="format"
          required
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
        >
          <option value="1v1">1v1 (solo)</option>
          <option value="2v2">2v2 (team required)</option>
          <option value="3v3">3v3 (team required)</option>
          <option value="4v4">4v4 (team required)</option>
          <option value="6v6">6v6 (team required)</option>
        </select>
      </div>

      {needsTeam && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Your {format} Team
          </label>
          {matchingTeams.length > 0 ? (
            <select name="team_id" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
              {matchingTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tag ? `[${t.tag}] ` : ""}{t.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">
              You don’t have a {format} team. <a href="/teams/create" className="underline">Create one</a>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-2">Best Of</label>
        <select name="best_of" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
          <option value="Bo1">Best of 1</option>
          <option value="Bo3">Best of 3</option>
          <option value="Bo5">Best of 5</option>
          <option value="Bo7">Best of 7</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Region</label>
        <select name="region" required className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]">
          <option value="NA East">NA East</option>
          <option value="NA West">NA West</option>
          <option value="EU">EU</option>
          <option value="Asia">Asia</option>
          <option value="SA">South America</option>
          <option value="OCE">Oceania</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={needsTeam && matchingTeams.length === 0}
        className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-40"
      >
        Post Match
      </button>
    </form>
  )
}