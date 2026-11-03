import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { randInt, type Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState, type RanchSpot } from '../core/state'
import { upgradeLevel } from './upgrades'

/** Espacios de cada rancho; cada Pokémon ocupa los de su rareza (`RARITY_INFO.ranchSlots`) */
export const RANCH_SLOTS = 10
/** Pokémon que caben en la Caja, uno por sitio sea cual sea su rareza */
export const BOX_SLOTS = 8

/** Ranchos que tiene el jugador: el primero más los comprados en la tienda */
export const ranchCount = (s: GameState): number => 1 + upgradeLevel(s, 'ranches')

export const slotsOf = (speciesId: number): number => RARITY_INFO[rarityOf(species(speciesId))].ranchSlots

/** Espacios ocupados de un rancho, contando a los suyos que están en ruta o de expedición */
export const usedSlots = (s: GameState, ranch: number): number =>
  s.owned.filter((m) => m.ranch === ranch).reduce((sum, m) => sum + slotsOf(m.speciesId), 0)

/** Si cabe una especie en el rancho; `freed` son los espacios que se liberan a la vez (p. ej. al evolucionar) */
export const fitsInRanch = (s: GameState, ranch: number, speciesId: number, freed = 0): boolean =>
  usedSlots(s, ranch) - freed + slotsOf(speciesId) <= RANCH_SLOTS

/** El primer rancho donde cabe la especie, o null si no cabe en ninguno */
export function ranchWithRoom(s: GameState, speciesId: number): number | null {
  for (let ranch = 0; ranch < ranchCount(s); ranch++) if (fitsInRanch(s, ranch, speciesId)) return ranch
  return null
}

export const boxedMons = (s: GameState) => s.owned.filter((m) => m.ranch === null)

/** Destino de un traslado: el índice de un rancho o null para la Caja */
export type MonDestination = number | null

/** Pokémon del rancho que pueden sustituir al activo si este se guarda en la Caja */
const activeCandidates = (s: GameState, uid: string) =>
  s.owned.filter((m) => m.uid !== uid && monPlace(s, m.uid) === MonPlace.Ranch)

/** Por qué no se puede llevar el Pokémon a ese destino (null si se puede) */
export function moveBlocker(s: GameState, uid: string, to: MonDestination): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const place = monPlace(s, uid)
  if (place === MonPlace.Run || place === MonPlace.Expedition) return 'Está fuera del rancho.'
  if (mon.ranch === to) return to === null ? 'Ya está en la Caja.' : 'Ya está en ese rancho.'
  if (to === null) {
    if (boxedMons(s).length >= BOX_SLOTS) return 'La Caja está llena.'
    if (uid === s.activeUid && !activeCandidates(s, uid).length) return 'Es tu único Pokémon fuera de la Caja.'
    return null
  }
  if (to < 0 || to >= ranchCount(s)) return 'Ese rancho no es tuyo.'
  return fitsInRanch(s, to, mon.speciesId) ? null : 'No cabe en ese rancho.'
}

/** Lleva el Pokémon a otro rancho o a la Caja; si era el activo, pasa a serlo uno del rancho al azar */
export function moveMon(s: GameState, uid: string, to: MonDestination, rng: Rng = Math.random): boolean {
  if (moveBlocker(s, uid, to)) return false
  const mon = findMon(s, uid)!
  if (to === null && uid === s.activeUid) {
    const candidates = activeCandidates(s, uid)
    s.activeUid = candidates[randInt(0, candidates.length - 1, rng)].uid
  }
  mon.ranch = to
  mon.spot = null
  return true
}

/** Deja al Pokémon donde se ha soltado al arrastrarlo, dentro del prado (0–100 %) */
export function placeMon(s: GameState, uid: string, spot: RanchSpot) {
  const mon = findMon(s, uid)
  if (!mon || monPlace(s, uid) !== MonPlace.Ranch) return
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  mon.spot = { x: clamp(spot.x), y: clamp(spot.y) }
}
