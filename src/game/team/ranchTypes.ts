import { RANCH_TYPE_MAX_OWNED, RANCH_TYPES, type RanchTypeId } from '../../data/ranchTypes'
import type { GameState } from '../core/state'
import { ranchCount } from './ranches'

/** Objetos de ese tipo de rancho comprados, colocados o no */
export const ranchTypeOwned = (s: GameState, id: RanchTypeId): number => s.ranchTypeItems[id] ?? 0

/** Objetos de ese tipo que están colocados en algún rancho */
const ranchTypePlaced = (s: GameState, id: RanchTypeId): number => Object.values(s.ranchTypeOf).filter((t) => t === id).length

/** Objetos de ese tipo guardados, listos para colocar */
export const ranchTypeAvailable = (s: GameState, id: RanchTypeId): number => ranchTypeOwned(s, id) - ranchTypePlaced(s, id)

/** Por qué no se puede comprar otro objeto de ese tipo (null si se puede) */
export function ranchTypeBuyBlocker(s: GameState, id: RanchTypeId): string | null {
  if (ranchTypeOwned(s, id) >= RANCH_TYPE_MAX_OWNED) return `Ya tienes ${RANCH_TYPE_MAX_OWNED}.`
  if (s.money < RANCH_TYPES[id].price) return `Necesitas ₽ ${RANCH_TYPES[id].price}.`
  return null
}

export function buyRanchType(s: GameState, id: RanchTypeId): boolean {
  if (ranchTypeBuyBlocker(s, id)) return false
  s.money -= RANCH_TYPES[id].price
  s.ranchTypeItems[id] = ranchTypeOwned(s, id) + 1
  return true
}

/** Coloca un objeto guardado en el rancho; si ya tenía otro, ese vuelve a guardarse */
export function placeRanchType(s: GameState, ranch: number, id: RanchTypeId): boolean {
  if (ranch < 0 || ranch >= ranchCount(s) || s.ranchTypeOf[ranch] === id || ranchTypeAvailable(s, id) < 1) return false
  s.ranchTypeOf[ranch] = id
  return true
}

/** Quita el tipo del rancho (vuelve a ser normal) y el objeto se guarda para usarlo en otro */
export function removeRanchType(s: GameState, ranch: number): boolean {
  if (s.ranchTypeOf[ranch] === undefined) return false
  delete s.ranchTypeOf[ranch]
  return true
}
