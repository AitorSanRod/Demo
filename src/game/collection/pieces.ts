import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { TutorialStep, type GameState } from '../core/state'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import { ranchWithRoom } from '../team/ranches'
import { MAX_STARS } from '../team/stats'
import { isSeen, markCaught } from './dex'

/** Piezas iguales que se gastan en cada combinación: desbloquean el Pokémon o le dan una ★ */
export const PIECES_PER_COMBINE = 5
/** ₽ que cuesta combinar piezas para dar una ★ (crear el Pokémon cuesta según su rareza: `RARITY_INFO.createPrice`) */
export const STAR_PRICE = 1000

/** Qué da combinar: el Pokémon si no lo tienes, una ★ si la admite y, con ★ al máximo, pokécuartos */
export const CombineKind = { Unlock: 'unlock', Star: 'star', Money: 'money' } as const
export type CombineKind = (typeof CombineKind)[keyof typeof CombineKind]

export interface CombineResult {
  kind: CombineKind
  speciesId: number
  level?: number
  stars?: number
  money?: number
}

export const piecesOf = (s: GameState, speciesId: number): number => s.pieces[speciesId] ?? 0

/** Suma piezas de una especie; se guardan aunque aún no se haya visto */
export function addPieces(s: GameState, speciesId: number, count: number) {
  s.pieces[speciesId] = piecesOf(s, speciesId) + count
}

export function combineKind(s: GameState, speciesId: number): CombineKind {
  const owned = s.owned.find((m) => m.speciesId === speciesId)
  if (!owned) return CombineKind.Unlock
  return owned.stars < MAX_STARS ? CombineKind.Star : CombineKind.Money
}

/** ₽ que cuesta combinar; el inicial del tutorial es gratis y cambiar piezas por ₽ no cuesta nada */
export function combinePrice(s: GameState, speciesId: number): number {
  const kind = combineKind(s, speciesId)
  if (kind === CombineKind.Money || s.tutorial === TutorialStep.Combine) return 0
  return kind === CombineKind.Unlock ? RARITY_INFO[rarityOf(species(speciesId))].createPrice : STAR_PRICE
}

/** Por qué no se puede combinar ahora (null si se puede): hay que haberla visto en una ruta o expedición */
export function combineBlocker(s: GameState, speciesId: number): string | null {
  if (!isSeen(s, speciesId)) return 'Encuéntralo antes en una ruta o en una expedición.'
  if (piecesOf(s, speciesId) < PIECES_PER_COMBINE) return `Faltan tickets: tienes ${piecesOf(s, speciesId)} de ${PIECES_PER_COMBINE}.`
  if (s.money < combinePrice(s, speciesId)) return `Necesitas ₽ ${combinePrice(s, speciesId)}.`
  if (combineKind(s, speciesId) === CombineKind.Unlock && ranchWithRoom(s, speciesId) === null)
    return 'No cabe en ningún rancho: libera espacio o guarda Pokémon en la Caja.'
  return null
}

export const canCombine = (s: GameState, speciesId: number): boolean => combineBlocker(s, speciesId) === null

export const combinableCount = (s: GameState): number =>
  Object.keys(s.pieces).filter((id) => canCombine(s, Number(id))).length

export function combine(s: GameState, speciesId: number): CombineResult | null {
  if (!canCombine(s, speciesId)) return null
  const kind = combineKind(s, speciesId)
  s.money -= combinePrice(s, speciesId)
  s.pieces[speciesId] -= PIECES_PER_COMBINE

  if (kind === CombineKind.Unlock) {
    const mon = createMon(speciesId, NEW_MON_LEVEL, ranchWithRoom(s, speciesId))
    s.owned.push(mon)
    markCaught(s, speciesId)
    // El primer Pokémon (el inicial del tutorial) sale directamente como activo
    s.activeUid ??= mon.uid
    if (s.tutorial === TutorialStep.Combine) s.tutorial = TutorialStep.Route
    return { kind, speciesId, level: mon.level }
  }
  if (kind === CombineKind.Star) {
    const mon = s.owned.find((m) => m.speciesId === speciesId)!
    mon.stars++
    return { kind, speciesId, stars: mon.stars }
  }
  const money = RARITY_INFO[rarityOf(species(speciesId))].surplusMoney
  s.money += money
  return { kind, speciesId, money }
}
