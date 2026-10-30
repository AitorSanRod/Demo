import { evolutionsOf } from '../../data/evolutions'
import { species } from '../../data/species'
import { markCaught } from '../collection/dex'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { createMon } from './mons'
import { MAX_STARS } from './stats'

/** Estrellas que necesita un Pokémon para poder evolucionar (las máximas) */
export const EVOLUTION_STARS = MAX_STARS
/** Nivel con el que llega la evolución si no la tenías ya en el equipo */
export const EVOLVED_LEVEL = 5

/**
 * New: la evolución llega nueva al equipo (Nv. 5, sin ★).
 * Star: ya la tenías y gana una ★; lo demás de ella no cambia.
 */
export const EvolveKind = { New: 'new', Star: 'star' } as const
export type EvolveKind = (typeof EvolveKind)[keyof typeof EvolveKind]

export interface EvolveResult {
  kind: EvolveKind
  fromId: number
  intoId: number
  stars: number
}

/** Por qué no puede evolucionar (null si puede) */
export function evolveBlocker(s: GameState, uid: string, intoId: number): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  if (!evolutionsOf(mon.speciesId).includes(intoId)) return `${species(mon.speciesId).name} no evoluciona a ${species(intoId).name}.`
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede evolucionar en el rancho.'
  if (mon.stars < EVOLUTION_STARS) return `Necesita ${EVOLUTION_STARS} ★ (tiene ${mon.stars}).`
  const owned = s.owned.find((m) => m.speciesId === intoId)
  if (owned && owned.stars >= MAX_STARS) return `Tu ${species(intoId).name} ya tiene las ★ al máximo.`
  return null
}

/** Evoluciona: el Pokémon desaparece del equipo y llega su evolución (o la que ya tenías gana una ★) */
export function evolve(s: GameState, uid: string, intoId: number): EvolveResult | null {
  if (evolveBlocker(s, uid, intoId)) return null
  const mon = findMon(s, uid)!
  const wasActive = s.activeUid === uid
  s.owned = s.owned.filter((m) => m.uid !== uid)

  let target = s.owned.find((m) => m.speciesId === intoId)
  const kind = target ? EvolveKind.Star : EvolveKind.New
  if (target) target.stars++
  else {
    target = createMon(intoId, EVOLVED_LEVEL)
    s.owned.push(target)
    markCaught(s, intoId)
  }
  if (wasActive) s.activeUid = target.uid
  return { kind, fromId: mon.speciesId, intoId, stars: target.stars }
}
