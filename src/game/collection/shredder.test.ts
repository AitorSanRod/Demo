import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { initialState } from '../core/state'
import { speciesOfRarity } from '../core/test-utils'
import { markSeen, toggleFavorite } from './dex'
import { addPieces, piecesOf } from './pieces'
import {
  buyPiece,
  PIECE_SHARD_PRICE,
  pieceShardPrice,
  raritySelection,
  selectionShards,
  shred,
  shreddableStock,
  SHARDS_PER_PIECE,
  shredSelection,
} from './shredder'

const COMMON = speciesOfRarity(Rarity.Common)
const OTHER_COMMON = speciesOfRarity(Rarity.Common, 1)
const LEGENDARY = speciesOfRarity(Rarity.Legendary)


describe('shred', () => {
  it('cambia cada pieza por trozos de MissingNo', () => {
    const s = initialState()
    addPieces(s, COMMON, 4)
    expect(shred(s, COMMON, 3)).toBe(3 * SHARDS_PER_PIECE[Rarity.Common])
    expect(piecesOf(s, COMMON)).toBe(1)
    expect(s.missingnoShards).toBe(3 * SHARDS_PER_PIECE[Rarity.Common])
  })

  it('las piezas más raras dan más trozos', () => {
    const s = initialState()
    addPieces(s, LEGENDARY, 2)
    expect(shred(s, LEGENDARY, 2)).toBe(2 * SHARDS_PER_PIECE[Rarity.Legendary])
  })

  it('no tritura más piezas de las que hay', () => {
    const s = initialState()
    addPieces(s, COMMON, 2)
    expect(shred(s, COMMON, 10)).toBe(2 * SHARDS_PER_PIECE[Rarity.Common])
    expect(piecesOf(s, COMMON)).toBe(0)
    expect(shred(s, COMMON, 1)).toBe(0)
  })
})

describe('favoritos', () => {
  it('las piezas de un favorito no aparecen ni se pueden triturar', () => {
    const s = initialState()
    addPieces(s, COMMON, 3)
    addPieces(s, LEGENDARY, 1)
    markSeen(s, COMMON)
    toggleFavorite(s, COMMON)
    expect(shreddableStock(s).map((p) => p.speciesId)).toEqual([LEGENDARY])
    expect(shred(s, COMMON, 3)).toBe(0)
    expect(piecesOf(s, COMMON)).toBe(3)
  })
})

describe('raritySelection', () => {
  it('elige todas las piezas de esa rareza menos las favoritas', () => {
    const s = initialState()
    addPieces(s, COMMON, 3)
    addPieces(s, OTHER_COMMON, 2)
    addPieces(s, LEGENDARY, 1)
    markSeen(s, OTHER_COMMON)
    toggleFavorite(s, OTHER_COMMON)
    expect(raritySelection(s, Rarity.Common)).toEqual({ [COMMON]: 3 })
    expect(raritySelection(s, Rarity.Legendary)).toEqual({ [LEGENDARY]: 1 })
  })
})

describe('shredSelection', () => {
  it('tritura todas las piezas elegidas y da los trozos previstos', () => {
    const s = initialState()
    addPieces(s, COMMON, 5)
    addPieces(s, LEGENDARY, 1)
    const selection = { [COMMON]: 3, [LEGENDARY]: 1 }
    const expected = 3 * SHARDS_PER_PIECE[Rarity.Common] + SHARDS_PER_PIECE[Rarity.Legendary]
    expect(selectionShards(selection)).toBe(expected)
    expect(shredSelection(s, selection)).toBe(expected)
    expect(piecesOf(s, COMMON)).toBe(2)
    expect(piecesOf(s, LEGENDARY)).toBe(0)
    expect(s.missingnoShards).toBe(expected)
  })
})

describe('buyPiece', () => {
  it('el precio depende de la rareza', () => {
    expect(pieceShardPrice(COMMON)).toBe(PIECE_SHARD_PRICE[Rarity.Common])
  })

  it('cobra los trozos y da 1 pieza, sin marcar el Pokémon como visto', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE[Rarity.Common]
    expect(buyPiece(s, COMMON)).toBe(true)
    expect(s.missingnoShards).toBe(0)
    expect(piecesOf(s, COMMON)).toBe(1)
    expect(s.seen).not.toContain(COMMON)
  })

  it('no compra sin trozos suficientes', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE[Rarity.Common] - 1
    expect(buyPiece(s, COMMON)).toBe(false)
    expect(piecesOf(s, COMMON)).toBe(0)
  })
})
