import { species } from '../../data/species'
import type { GameState } from '../core/state'

/** Nombre que se muestra de una especie que aún no se ha visto */
const UNKNOWN_NAME = '???'

export const isSeen = (s: GameState, speciesId: number): boolean => s.seen.includes(speciesId)

/** Solo se llama al ver la especie en una ruta o descubrirla (en una expedición o con trozos); tener piezas no cuenta */
export function markSeen(s: GameState, speciesId: number) {
  if (!isSeen(s, speciesId)) s.seen.push(speciesId)
}

export const knownName = (s: GameState, speciesId: number): string =>
  isSeen(s, speciesId) ? species(speciesId).name : UNKNOWN_NAME

export function markCaught(s: GameState, speciesId: number) {
  markSeen(s, speciesId)
  if (!s.caught.includes(speciesId)) s.caught.push(speciesId)
}

export const isFavorite = (s: GameState, speciesId: number): boolean => s.favorites.includes(speciesId)

/** Marca o desmarca una especie vista como favorita */
export function toggleFavorite(s: GameState, speciesId: number) {
  if (isFavorite(s, speciesId)) s.favorites = s.favorites.filter((id) => id !== speciesId)
  else if (isSeen(s, speciesId)) s.favorites.push(speciesId)
}
