import { rarityOf, species, type Rarity } from '../data/species'
import { isFavorite } from './dex'
import { addPieces, piecesOf } from './pieces'
import type { GameState } from './state'

/** Trozos de MissingNo que da cada pieza triturada, según la rareza del Pokémon */
export const SHARDS_PER_PIECE: Record<Rarity, number> = { common: 1, rare: 1, epic: 2, legendary: 3 }

/** Trozos de MissingNo que cuesta comprar 1 pieza del Pokémon elegido, según su rareza */
export const PIECE_SHARD_PRICE: Record<Rarity, number> = { common: 10, rare: 15, epic: 20, legendary: 25 }

export const pieceShardPrice = (speciesId: number): number => PIECE_SHARD_PRICE[rarityOf(species(speciesId))]

export const shardsPerPiece = (speciesId: number): number => SHARDS_PER_PIECE[rarityOf(species(speciesId))]

/** Especies con piezas que se pueden triturar (las favoritas quedan protegidas), ordenadas por número */
export function shreddableStock(s: GameState): { speciesId: number; count: number }[] {
  return Object.entries(s.pieces)
    .map(([id, count]) => ({ speciesId: Number(id), count }))
    .filter((p) => p.count > 0 && !isFavorite(s, p.speciesId))
    .sort((a, b) => a.speciesId - b.speciesId)
}

/** Tritura `count` piezas de una especie (o las que tenga) y devuelve los trozos obtenidos. Las favoritas, no. */
export function shred(s: GameState, speciesId: number, count: number): number {
  if (isFavorite(s, speciesId)) return 0
  const amount = Math.min(count, piecesOf(s, speciesId))
  if (amount <= 0) return 0
  s.pieces[speciesId] -= amount
  const shards = amount * shardsPerPiece(speciesId)
  s.missingnoShards += shards
  return shards
}

/** Piezas elegidas para triturar: speciesId → cantidad */
export type ShredSelection = Record<number, number>

/** Selección con todas las piezas triturables de una rareza */
export function raritySelection(s: GameState, rarity: Rarity): ShredSelection {
  const stock = shreddableStock(s).filter((p) => rarityOf(species(p.speciesId)) === rarity)
  return Object.fromEntries(stock.map((p) => [p.speciesId, p.count]))
}

/** Trozos que daría triturar la selección, sin aplicarla */
export const selectionShards = (selection: ShredSelection): number =>
  Object.entries(selection).reduce((sum, [id, count]) => sum + count * shardsPerPiece(Number(id)), 0)

/** Tritura todas las piezas de la selección de una vez y devuelve los trozos obtenidos */
export function shredSelection(s: GameState, selection: ShredSelection): number {
  return Object.entries(selection).reduce((sum, [id, count]) => sum + shred(s, Number(id), count), 0)
}

export function buyPiece(s: GameState, speciesId: number): boolean {
  const price = pieceShardPrice(speciesId)
  if (s.missingnoShards < price) return false
  s.missingnoShards -= price
  addPieces(s, speciesId, 1)
  return true
}
