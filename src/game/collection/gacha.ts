import { Rarity, RARITY_INFO, SPECIES, rarityOf } from '../../data/species'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { addPieces } from './pieces'

/** Piezas que da cada tirada; cada una sortea su rareza y su especie por separado */
export const PIECES_PER_PULL = 5

/** Probabilidad (0-1) de que una tirada cambie una de sus piezas por dinero; como mucho una casilla por tirada */
export const MONEY_SLOT_CHANCE = 0.15

/** Premios de dinero de esa casilla: ₽ que da y peso relativo de que salga (los grandes, más raros) */
export const MONEY_PRIZES: readonly { amount: number; weight: number }[] = [
  { amount: 100, weight: 35 },
  { amount: 250, weight: 25 },
  { amount: 400, weight: 18 },
  { amount: 500, weight: 15 },
  { amount: 1000, weight: 7 },
]

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

function rollMoney(rng: Rng): number {
  let roll = rng() * MONEY_PRIZES.reduce((sum, p) => sum + p.weight, 0)
  for (const p of MONEY_PRIZES) {
    roll -= p.weight
    if (roll < 0) return p.amount
  }
  return MONEY_PRIZES[MONEY_PRIZES.length - 1].amount
}

export interface PullResult {
  pieces: PieceDrop[]
  /** ₽ de cada casilla de dinero que salió (como mucho una por tirada) */
  money: number[]
}

/** Gasta hasta `count` tickets (los que haya) y devuelve las piezas y el dinero obtenidos */
export function pull(s: GameState, count = 1, rng: Rng = Math.random): PullResult {
  const result: PullResult = { pieces: [], money: [] }
  for (; count > 0 && s.tickets > 0; count--) {
    s.tickets--
    const hasMoney = rng() < MONEY_SLOT_CHANCE
    if (hasMoney) result.money.push(rollMoney(rng))
    for (let i = hasMoney ? 1 : 0; i < PIECES_PER_PULL; i++) result.pieces.push(rollPiece(rng))
  }
  for (const d of result.pieces) addPieces(s, d.speciesId, 1)
  for (const amount of result.money) s.money += amount
  return result
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
