import { RARITY_INFO, rarityOf, species } from '../data/species'
import { markCaught, markSeen } from './dex'
import { createMon } from './engine'
import type { GameState } from './state'
import { MAX_STARS } from './stats'

/** Piezas iguales que se gastan en cada combinación: desbloquean el Pokémon o le dan una ★ */
export const PIECES_PER_COMBINE = 5

/** Qué da combinar: el Pokémon si no lo tienes, una ★ si la admite y, con ★ al máximo, pokécuartos */
export type CombineKind = 'unlock' | 'star' | 'money'

export interface CombineResult {
  kind: CombineKind
  speciesId: number
  level?: number
  stars?: number
  money?: number
}

export const piecesOf = (s: GameState, speciesId: number): number => s.pieces[speciesId] ?? 0

export const canCombine = (s: GameState, speciesId: number): boolean => piecesOf(s, speciesId) >= PIECES_PER_COMBINE

export const combinableCount = (s: GameState): number =>
  Object.keys(s.pieces).filter((id) => canCombine(s, Number(id))).length

export function addPieces(s: GameState, speciesId: number, count: number) {
  s.pieces[speciesId] = piecesOf(s, speciesId) + count
  markSeen(s, speciesId)
}

export function combineKind(s: GameState, speciesId: number): CombineKind {
  const owned = s.owned.find((m) => m.speciesId === speciesId)
  if (!owned) return 'unlock'
  return owned.stars < MAX_STARS ? 'star' : 'money'
}

export function combine(s: GameState, speciesId: number): CombineResult | null {
  if (!canCombine(s, speciesId)) return null
  const kind = combineKind(s, speciesId)
  s.pieces[speciesId] -= PIECES_PER_COMBINE

  if (kind === 'unlock') {
    const level = arrivalLevel(s)
    s.owned.push(createMon(speciesId, level))
    markCaught(s, speciesId)
    return { kind, speciesId, level }
  }
  if (kind === 'star') {
    const mon = s.owned.find((m) => m.speciesId === speciesId)!
    mon.stars++
    return { kind, speciesId, stars: mon.stars }
  }
  const money = RARITY_INFO[rarityOf(species(speciesId))].dupeMoney
  s.money += money
  return { kind, speciesId, money }
}

/** Los Pokémon nuevos llegan a un nivel cercano al de tu equipo */
function arrivalLevel(s: GameState): number {
  const top = Math.max(5, ...s.owned.map((m) => m.level))
  return Math.max(5, Math.floor(top * 0.7))
}
