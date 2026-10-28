import { RARITY_INFO, SPECIES, rarityOf, type Rarity } from '../data/species'
import type { Rng } from './battle'
import { createMon, markCaught } from './engine'
import type { GameState } from './state'
import { MAX_STARS } from './stats'

export interface PullResult {
  speciesId: number
  rarity: Rarity
  isNew: boolean
  /** Para duplicados: estrellas tras la tirada y pokécuartos recibidos */
  stars?: number
  money?: number
}

const POOLS = Object.fromEntries(
  (Object.keys(RARITY_INFO) as Rarity[]).map((r) => [r, SPECIES.filter((s) => rarityOf(s) === r)]),
) as Record<Rarity, typeof SPECIES>

function rollRarity(rng: Rng): Rarity {
  let roll = rng()
  for (const r of ['legendary', 'epic', 'rare'] as const) {
    roll -= RARITY_INFO[r].rate
    if (roll < 0) return r
  }
  return 'common'
}

/** Los Pokémon nuevos llegan a un nivel cercano al de tu equipo */
function arrivalLevel(s: GameState): number {
  const top = Math.max(5, ...s.owned.map((m) => m.level))
  return Math.max(5, Math.floor(top * 0.7))
}

export function pull(s: GameState, rng: Rng = Math.random): PullResult | null {
  if (s.tickets < 1) return null
  s.tickets--
  const rarity = rollRarity(rng)
  const pool = POOLS[rarity]
  const sp = pool[Math.floor(rng() * pool.length)]
  const existing = s.owned.find((m) => m.speciesId === sp.id)

  if (existing) {
    const money = RARITY_INFO[rarity].dupeMoney
    existing.stars = Math.min(MAX_STARS, existing.stars + 1)
    s.money += money
    return { speciesId: sp.id, rarity, isNew: false, stars: existing.stars, money }
  }
  s.owned.push(createMon(sp.id, arrivalLevel(s)))
  markCaught(s, sp.id)
  return { speciesId: sp.id, rarity, isNew: true }
}

export const TICKET_PRICE = 250

export function buyTicket(s: GameState) {
  if (s.money < TICKET_PRICE) return
  s.money -= TICKET_PRICE
  s.tickets++
}
