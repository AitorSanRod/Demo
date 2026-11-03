import { PASSIVE_THRESHOLDS, type PassiveLevel, type PassiveRef } from '../../data/passives'
import { RANCH_TYPE_THRESHOLD_DISCOUNT, RANCH_TYPES } from '../../data/ranchTypes'
import { species } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { GameState } from '../core/state'

/** Pokémon del rancho por tipo: cuentan todos los que pertenecen a él, estén donde estén; los de dos tipos, en ambos */
export function ranchTypeCounts(s: GameState, ranch: number): Partial<Record<PokeType, number>> {
  const counts: Partial<Record<PokeType, number>> = {}
  for (const m of s.owned.filter((m) => m.ranch === ranch)) {
    for (const t of species(m.speciesId).types) counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

/** Tipo de rancho colocado en el rancho, si tiene */
export const placedRanchType = (s: GameState, ranch: number) => s.ranchTypeOf[ranch]

/** Pokémon de un tipo que hacen falta en el rancho para ese nivel de su pasiva (uno menos si el rancho lo favorece) */
export function passiveThreshold(s: GameState, ranch: number, type: PokeType, level: PassiveLevel): number {
  const placed = placedRanchType(s, ranch)
  const favored = placed !== undefined && RANCH_TYPES[placed].favors.includes(type)
  return PASSIVE_THRESHOLDS[level - 1] - (favored ? RANCH_TYPE_THRESHOLD_DISCOUNT : 0)
}

/** Pasivas que da el rancho: por cada tipo, el nivel más alto alcanzado */
export function ranchPassives(s: GameState, ranch: number): PassiveRef[] {
  const counts = ranchTypeCounts(s, ranch)
  const passives: PassiveRef[] = []
  for (const [type, count] of Object.entries(counts) as [PokeType, number][]) {
    if (count >= passiveThreshold(s, ranch, type, 2)) passives.push({ type, level: 2 })
    else if (count >= passiveThreshold(s, ranch, type, 1)) passives.push({ type, level: 1 })
  }
  return passives
}
