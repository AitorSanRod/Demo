import type { Stone } from '../../data/stones'
import type { GameState } from '../core/state'

/** ₽ que cuesta cada piedra evolutiva en la tienda (sin límite de compra) */
export const STONE_PRICE = 2000

export const stonesOf = (s: GameState, stone: Stone): number => s.stones[stone] ?? 0

/** Compra una piedra; false si no hay ₽ */
export function buyStone(s: GameState, stone: Stone): boolean {
  if (s.money < STONE_PRICE) return false
  s.money -= STONE_PRICE
  s.stones[stone] = stonesOf(s, stone) + 1
  return true
}

/** Gasta una piedra al evolucionar; false si no queda ninguna */
export function spendStone(s: GameState, stone: Stone): boolean {
  if (stonesOf(s, stone) < 1) return false
  s.stones[stone] = stonesOf(s, stone) - 1
  return true
}
