import { describe, expect, it } from 'vitest'
import { SPECIES, STARTERS } from '../../data/species'
import { GoodKind, MAX_ASKED_SPECIES, MAX_TRADE_COUNT, MAX_TRADE_MONEY, parseAsk, parseOffer } from './tradeGoods'

const [A, B, C] = STARTERS
const UNKNOWN_SPECIES = -7

describe('comprobar lo que llega al servidor', () => {
  it('ofertas', () => {
    expect(parseOffer({ kind: GoodKind.Mon, uid: 'abc' })).toEqual({ kind: GoodKind.Mon, uid: 'abc' })
    expect(parseOffer({ kind: GoodKind.Mon, uid: '' })).toBeNull()
    expect(parseOffer({ kind: GoodKind.Pieces, speciesId: A, count: MAX_TRADE_COUNT })).not.toBeNull()
    expect(parseOffer({ kind: GoodKind.Pieces, speciesId: A, count: MAX_TRADE_COUNT + 1 })).toBeNull()
    expect(parseOffer({ kind: GoodKind.Pieces, speciesId: UNKNOWN_SPECIES, count: 1 })).toBeNull()
    expect(parseOffer({ kind: GoodKind.Shards, count: 0 })).toBeNull()
    expect(parseOffer({ kind: GoodKind.Money, count: 5 })).toBeNull()
    expect(parseOffer(null)).toBeNull()
  })

  it('lo pedido', () => {
    expect(parseAsk({ kind: GoodKind.Mon, speciesIds: [A, B, B] })).toEqual({ kind: GoodKind.Mon, speciesIds: [A, B] })
    expect(parseAsk({ kind: GoodKind.Mon, speciesIds: [] })).toBeNull()
    expect(parseAsk({ kind: GoodKind.Mon, speciesIds: [A, UNKNOWN_SPECIES] })).toBeNull()
    const tooMany = SPECIES.slice(0, MAX_ASKED_SPECIES + 1).map((sp) => sp.id)
    expect(parseAsk({ kind: GoodKind.Mon, speciesIds: tooMany })).toBeNull()
    expect(parseAsk({ kind: GoodKind.Mon, speciesIds: [A, B, C] })).not.toBeNull()
    expect(parseAsk({ kind: GoodKind.Money, count: MAX_TRADE_MONEY })).not.toBeNull()
    expect(parseAsk({ kind: GoodKind.Money, count: MAX_TRADE_MONEY + 1 })).toBeNull()
    expect(parseAsk({ kind: GoodKind.Tickets, count: 1.5 })).toBeNull()
    expect(parseAsk({ kind: GoodKind.Pieces, speciesId: A, count: 1 })).toBeNull()
  })
})
