export type Hero = {
  id: string
  name: string
}

// Core roster — names only for now (portraits later)
export const HEROES: Hero[] = [
  { id: "abrams", name: "Abrams" },
  { id: "bebop", name: "Bebop" },
  { id: "dynamo", name: "Dynamo" },
  { id: "grey_talon", name: "Grey Talon" },
  { id: "haze", name: "Haze" },
  { id: "infernus", name: "Infernus" },
  { id: "ivy", name: "Ivy" },
  { id: "kelvin", name: "Kelvin" },
  { id: "lady_geist", name: "Lady Geist" },
  { id: "lash", name: "Lash" },
  { id: "mcginnis", name: "McGinnis" },
  { id: "mo_krill", name: "Mo & Krill" },
  { id: "paradox", name: "Paradox" },
  { id: "pocket", name: "Pocket" },
  { id: "seven", name: "Seven" },
  { id: "shiv", name: "Shiv" },
  { id: "vindicta", name: "Vindicta" },
  { id: "viscous", name: "Viscous" },
  { id: "warden", name: "Warden" },
  { id: "wraith", name: "Wraith" },
  { id: "yamato", name: "Yamato" },
]

/** step: who acts, ban or pick, how many this step still needs */
export type DraftStep = {
  side: "first_ban" | "other"
  type: "ban" | "pick"
  count: number
}

export const DRAFT_STEPS: DraftStep[] = [
  { side: "first_ban", type: "ban", count: 1 },
  { side: "other", type: "ban", count: 1 },
  { side: "first_ban", type: "pick", count: 1 },
  { side: "other", type: "pick", count: 2 },
  { side: "first_ban", type: "pick", count: 2 },
  { side: "other", type: "pick", count: 1 },
  { side: "other", type: "ban", count: 1 },
  { side: "first_ban", type: "ban", count: 1 },
  { side: "other", type: "pick", count: 1 },
  { side: "first_ban", type: "pick", count: 2 },
  { side: "other", type: "pick", count: 2 },
  { side: "first_ban", type: "pick", count: 1 },
]

export type DraftState = {
  step: number
  withinStep: number
  bans: { heroId: string; teamId: string }[]
  picks: { heroId: string; teamId: string }[]
  phase: "ban" | "pick" | "done"
  turn_team_id: string | null
}