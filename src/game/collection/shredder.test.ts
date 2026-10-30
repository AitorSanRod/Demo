import { describe, expect, it } from 'vitest'
import { Pokemon } from '../../data/pokemon'
import { Rarity } from '../../data/species'
import { initialState } from '../core/state'
import { toggleFavorite } from './dex'
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


describe('shred', () => {
  it('cambia cada pieza por trozos de MissingNo', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, 4)
    expect(shred(s, Pokemon.Pidgey, 3)).toBe(3 * SHARDS_PER_PIECE.common)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(1)
    expect(s.missingnoShards).toBe(3 * SHARDS_PER_PIECE.common)
  })

  it('las piezas más raras dan más trozos', () => {
    const s = initialState()
    addPieces(s, Pokemon.Mewtwo, 2)
    expect(shred(s, Pokemon.Mewtwo, 2)).toBe(2 * SHARDS_PER_PIECE.legendary)
  })

  it('no tritura más piezas de las que hay', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, 2)
    expect(shred(s, Pokemon.Pidgey, 10)).toBe(2 * SHARDS_PER_PIECE.common)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(0)
    expect(shred(s, Pokemon.Pidgey, 1)).toBe(0)
  })
})

describe('favoritos', () => {
  it('las piezas de un favorito no aparecen ni se pueden triturar', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, 3)
    addPieces(s, Pokemon.Mewtwo, 1)
    toggleFavorite(s, Pokemon.Pidgey)
    expect(shreddableStock(s).map((p) => p.speciesId)).toEqual([Pokemon.Mewtwo])
    expect(shred(s, Pokemon.Pidgey, 3)).toBe(0)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(3)
  })
})

describe('raritySelection', () => {
  it('elige todas las piezas de esa rareza menos las favoritas', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, 3)
    addPieces(s, Pokemon.Rattata, 2)
    addPieces(s, Pokemon.Mewtwo, 1)
    toggleFavorite(s, 19)
    expect(raritySelection(s, Rarity.Common)).toEqual({ [Pokemon.Pidgey]: 3 })
    expect(raritySelection(s, Rarity.Legendary)).toEqual({ [Pokemon.Mewtwo]: 1 })
  })
})

describe('shredSelection', () => {
  it('tritura todas las piezas elegidas y da los trozos previstos', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, 5)
    addPieces(s, Pokemon.Mewtwo, 1)
    const selection = { [Pokemon.Pidgey]: 3, [Pokemon.Mewtwo]: 1 }
    const expected = 3 * SHARDS_PER_PIECE.common + SHARDS_PER_PIECE.legendary
    expect(selectionShards(selection)).toBe(expected)
    expect(shredSelection(s, selection)).toBe(expected)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(2)
    expect(piecesOf(s, Pokemon.Mewtwo)).toBe(0)
    expect(s.missingnoShards).toBe(expected)
  })
})

describe('buyPiece', () => {
  it('el precio depende de la rareza', () => {
    expect(pieceShardPrice(Pokemon.Pidgey)).toBe(PIECE_SHARD_PRICE.common)
  })

  it('cobra los trozos y da 1 pieza, que marca el Pokémon como visto', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE.common
    expect(buyPiece(s, Pokemon.Pidgey)).toBe(true)
    expect(s.missingnoShards).toBe(0)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(1)
    expect(s.seen).toContain(Pokemon.Pidgey)
  })

  it('no compra sin trozos suficientes', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE.common - 1
    expect(buyPiece(s, Pokemon.Pidgey)).toBe(false)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(0)
  })
})
