import type { GameState } from './state'

export function markSeen(s: GameState, speciesId: number) {
  if (!s.seen.includes(speciesId)) s.seen.push(speciesId)
}

export function markCaught(s: GameState, speciesId: number) {
  markSeen(s, speciesId)
  if (!s.caught.includes(speciesId)) s.caught.push(speciesId)
}

export const piecesOf = (s: GameState, speciesId: number): number => s.pieces[speciesId] ?? 0

/** Suma piezas de una especie; tener piezas la marca como vista */
export function addPieces(s: GameState, speciesId: number, count: number) {
  s.pieces[speciesId] = piecesOf(s, speciesId) + count
  markSeen(s, speciesId)
}

export const isFavorite = (s: GameState, speciesId: number): boolean => s.favorites.includes(speciesId)

/** Marca o desmarca una especie vista como favorita */
export function toggleFavorite(s: GameState, speciesId: number) {
  if (isFavorite(s, speciesId)) s.favorites = s.favorites.filter((id) => id !== speciesId)
  else if (s.seen.includes(speciesId)) s.favorites.push(speciesId)
}
