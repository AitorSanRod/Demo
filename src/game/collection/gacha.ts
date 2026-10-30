import { RARITY_INFO, SPECIES, rarityOf, type Rarity } from '../../data/species'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { addPieces } from './pieces'

/** Piezas que da cada tirada; cada una sortea su rareza y su especie por separado */
export const PIECES_PER_PULL = 5

export interface PieceDrop {
  speciesId: number
  rarity: Rarity
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

function rollPiece(rng: Rng): PieceDrop {
  const rarity = rollRarity(rng)
  const pool = POOLS[rarity]
  return { speciesId: pool[Math.floor(rng() * pool.length)].id, rarity }
}

/** Gasta hasta `count` tickets (los que haya) y devuelve todas las piezas obtenidas */
export function pull(s: GameState, count = 1, rng: Rng = Math.random): PieceDrop[] {
  const drops: PieceDrop[] = []
  for (; count > 0 && s.tickets > 0; count--) {
    s.tickets--
    for (let i = 0; i < PIECES_PER_PULL; i++) drops.push(rollPiece(rng))
  }
  for (const d of drops) addPieces(s, d.speciesId, 1)
  return drops
}

export const TICKET_PRICE = 250

export function buyTicket(s: GameState) {
  if (s.money < TICKET_PRICE) return
  s.money -= TICKET_PRICE
  s.tickets++
}
