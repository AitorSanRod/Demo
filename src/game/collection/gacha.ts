import { Rarity, RARITY_INFO, SPECIES, rarityOf } from '../../data/species'
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
  for (const r of [Rarity.Legendary, Rarity.Epic, Rarity.Rare]) {
    roll -= RARITY_INFO[r].rate
    if (roll < 0) return r
  }
  return Rarity.Common
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

/** ₽ que cuesta cada ticket de gacha */
export const TICKET_PRICE = 250

/** Cuántos tickets de gacha se pueden comprar ahora con el dinero que hay */
export const maxTicketsToBuy = (s: GameState): number => Math.floor(s.money / TICKET_PRICE)

/** Compra `count` tickets de gacha de una vez; si no llega el dinero para todos, no compra ninguno */
export function buyTicket(s: GameState, count = 1): boolean {
  if (count < 1 || count > maxTicketsToBuy(s)) return false
  s.money -= count * TICKET_PRICE
  s.tickets += count
  return true
}
