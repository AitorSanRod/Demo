import { rarityOf, species, type Rarity } from '../../data/species'
import type { GameState } from '../core/state'
import { givePiecesBlocker, takeMon } from './tradeGive'

// Venta directa al servidor (Tienda › Venta): Pokémon, tickets de una especie y trozos de MissingNo a precio fijo. Se
// hace en la partida, como una compra de la tienda: no sale nada hacia otro jugador.

/** ₽ por vender un Pokémon, según su rareza */
export const MON_SALE_PRICE: Record<Rarity, number> = { common: 250, rare: 500, epic: 1000, legendary: 2500 }
/** ₽ por cada ticket de un Pokémon vendido, según su rareza */
export const PIECE_SALE_PRICE: Record<Rarity, number> = { common: 50, rare: 100, epic: 150, legendary: 250 }
/** ₽ por cada trozo de MissingNo vendido */
export const SHARD_SALE_PRICE = 10

export const monSalePrice = (speciesId: number): number => MON_SALE_PRICE[rarityOf(species(speciesId))]
export const pieceSalePrice = (speciesId: number): number => PIECE_SALE_PRICE[rarityOf(species(speciesId))]

/** Vende el Pokémon (si se puede dar) y devuelve los ₽ cobrados; 0 si no se ha vendido */
export function sellMon(s: GameState, uid: string): number {
  const mon = takeMon(s, uid)
  if (!mon) return 0
  const price = monSalePrice(mon.speciesId)
  s.money += price
  return price
}

/** Vende `count` tickets de la especie y devuelve los ₽ cobrados; 0 si no se puede */
export function sellPieces(s: GameState, speciesId: number, count: number): number {
  if (givePiecesBlocker(s, speciesId, count)) return 0
  s.pieces[speciesId] -= count
  const money = count * pieceSalePrice(speciesId)
  s.money += money
  return money
}

/** Vende `count` trozos de MissingNo y devuelve los ₽ cobrados; 0 si no hay tantos */
export function sellShards(s: GameState, count: number): number {
  if (count < 1 || s.missingnoShards < count) return 0
  s.missingnoShards -= count
  const money = count * SHARD_SALE_PRICE
  s.money += money
  return money
}
