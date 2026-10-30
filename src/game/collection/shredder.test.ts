import { describe, expect, it } from 'vitest'
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

const PIDGEY = 16
const MEWTWO = 150

describe('shred', () => {
  it('cambia cada pieza por trozos de MissingNo', () => {
    const s = initialState()
    addPieces(s, PIDGEY, 4)
    expect(shred(s, PIDGEY, 3)).toBe(3 * SHARDS_PER_PIECE.common)
    expect(piecesOf(s, PIDGEY)).toBe(1)
    expect(s.missingnoShards).toBe(3 * SHARDS_PER_PIECE.common)
  })

  it('las piezas más raras dan más trozos', () => {
    const s = initialState()
    addPieces(s, MEWTWO, 2)
    expect(shred(s, MEWTWO, 2)).toBe(2 * SHARDS_PER_PIECE.legendary)
  })

  it('no tritura más piezas de las que hay', () => {
    const s = initialState()
    addPieces(s, PIDGEY, 2)
    expect(shred(s, PIDGEY, 10)).toBe(2 * SHARDS_PER_PIECE.common)
    expect(piecesOf(s, PIDGEY)).toBe(0)
    expect(shred(s, PIDGEY, 1)).toBe(0)
  })
})

describe('favoritos', () => {
  it('las piezas de un favorito no aparecen ni se pueden triturar', () => {
    const s = initialState()
    addPieces(s, PIDGEY, 3)
    addPieces(s, MEWTWO, 1)
    toggleFavorite(s, PIDGEY)
    expect(shreddableStock(s).map((p) => p.speciesId)).toEqual([MEWTWO])
    expect(shred(s, PIDGEY, 3)).toBe(0)
    expect(piecesOf(s, PIDGEY)).toBe(3)
  })
})

describe('raritySelection', () => {
  it('elige todas las piezas de esa rareza menos las favoritas', () => {
    const s = initialState()
    addPieces(s, PIDGEY, 3)
    addPieces(s, 19, 2)
    addPieces(s, MEWTWO, 1)
    toggleFavorite(s, 19)
    expect(raritySelection(s, 'common')).toEqual({ [PIDGEY]: 3 })
    expect(raritySelection(s, 'legendary')).toEqual({ [MEWTWO]: 1 })
  })
})

describe('shredSelection', () => {
  it('tritura todas las piezas elegidas y da los trozos previstos', () => {
    const s = initialState()
    addPieces(s, PIDGEY, 5)
    addPieces(s, MEWTWO, 1)
    const selection = { [PIDGEY]: 3, [MEWTWO]: 1 }
    const expected = 3 * SHARDS_PER_PIECE.common + SHARDS_PER_PIECE.legendary
    expect(selectionShards(selection)).toBe(expected)
    expect(shredSelection(s, selection)).toBe(expected)
    expect(piecesOf(s, PIDGEY)).toBe(2)
    expect(piecesOf(s, MEWTWO)).toBe(0)
    expect(s.missingnoShards).toBe(expected)
  })
})

describe('buyPiece', () => {
  it('el precio depende de la rareza', () => {
    expect(pieceShardPrice(PIDGEY)).toBe(PIECE_SHARD_PRICE.common)
  })

  it('cobra los trozos y da 1 pieza, que marca el Pokémon como visto', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE.common
    expect(buyPiece(s, PIDGEY)).toBe(true)
    expect(s.missingnoShards).toBe(0)
    expect(piecesOf(s, PIDGEY)).toBe(1)
    expect(s.seen).toContain(PIDGEY)
  })

  it('no compra sin trozos suficientes', () => {
    const s = initialState()
    s.missingnoShards = PIECE_SHARD_PRICE.common - 1
    expect(buyPiece(s, PIDGEY)).toBe(false)
    expect(piecesOf(s, PIDGEY)).toBe(0)
  })
})
