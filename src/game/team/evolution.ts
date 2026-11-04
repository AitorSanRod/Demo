import { evolutionTo, type Evolution } from '../../data/evolutions'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { STONES } from '../../data/stones'
import { markCaught } from '../collection/dex'
import { findMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { fitsInRanch, ranchCount, slotsOf, type MonDestination } from './ranches'
import { maxHp } from './stats'
import { spendStone, stonesOf } from './stones'

// Evolución desde la ficha: al llegar al nivel de su evolución o gastando una piedra, pagando según la rareza de la
// evolución. Es el mismo Pokémon con otra especie: conserva nivel y EXP, pierde las ★ y queda con todos sus PS.

export interface EvolveResult {
  fromId: number
  intoId: number
  /** Dónde queda: su rancho, otro con hueco (si en el suyo no cabía) o la Caja (null) */
  destination: MonDestination
}

/** ₽ que cuesta evolucionar a `intoId` (según su rareza) */
export const evolvePrice = (intoId: number): number => RARITY_INFO[rarityOf(species(intoId))].evolvePrice

/**
 * Dónde quedará al evolucionar: en la Caja se queda en ella; en un rancho, en el suyo si la evolución cabe y si no en
 * el primero con hueco. undefined si no cabe en ninguno
 */
export function evolveDestination(s: GameState, mon: OwnedMon, intoId: number): MonDestination | undefined {
  if (mon.ranch === null) return null
  if (fitsInRanch(s, mon.ranch, intoId, slotsOf(mon.speciesId))) return mon.ranch
  for (let ranch = 0; ranch < ranchCount(s); ranch++) if (ranch !== mon.ranch && fitsInRanch(s, ranch, intoId)) return ranch
  return undefined
}

/** Lo que pide la evolución en sí: su nivel o su piedra (null si lo cumple) */
function requirementBlocker(s: GameState, mon: OwnedMon, evo: Evolution): string | null {
  if (evo.stone !== undefined) return stonesOf(s, evo.stone) < 1 ? `Necesitas una ${STONES[evo.stone].name}.` : null
  return mon.level < evo.level ? `A Nv. ${evo.level} podrá evolucionar.` : null
}

/** Por qué no puede evolucionar a `intoId` (null si puede) */
export function evolveBlocker(s: GameState, uid: string, intoId: number): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const evo = evolutionTo(mon.speciesId, intoId)
  if (!evo) return `${species(mon.speciesId).name} no evoluciona a ${species(intoId).name}.`
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return 'Solo puede evolucionar en el rancho o en la Caja.'
  const requirement = requirementBlocker(s, mon, evo)
  if (requirement) return requirement
  if (s.owned.some((m) => m.speciesId === intoId)) return `Ya tienes a ${species(intoId).name}.`
  if (s.money < evolvePrice(intoId)) return `Necesitas ₽ ${evolvePrice(intoId)}.`
  if (evolveDestination(s, mon, intoId) === undefined) return 'No hay hueco en ningún rancho: libera espacio o guarda Pokémon en la Caja.'
  return null
}

/**
 * Evoluciona: paga, gasta la piedra si hace falta y el Pokémon cambia de especie. En la Pokédex la especie de antes
 * vuelve a quedar solo como vista (silueta) y se puede volver a crear con sus piezas
 */
export function evolve(s: GameState, uid: string, intoId: number): EvolveResult | null {
  if (evolveBlocker(s, uid, intoId)) return null
  const mon = findMon(s, uid)!
  const evo = evolutionTo(mon.speciesId, intoId)!
  const destination = evolveDestination(s, mon, intoId)!
  const fromId = mon.speciesId
  s.money -= evolvePrice(intoId)
  if (evo.stone !== undefined) spendStone(s, evo.stone)
  if (destination !== mon.ranch) mon.spot = null
  Object.assign(mon, { speciesId: intoId, stars: 0, ranch: destination })
  mon.hp = maxHp(mon)
  s.caught = s.caught.filter((id) => id !== fromId)
  markCaught(s, intoId)
  return { fromId, intoId, destination }
}
