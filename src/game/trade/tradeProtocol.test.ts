import { describe, expect, it } from 'vitest'
import { STARTERS } from '../../data/species'
import { GoodKind } from './tradeGoods'
import { parseTradeRequest, TradeAction } from './tradeProtocol'

const [A] = STARTERS
const ask = { kind: GoodKind.Money, count: 10 }

describe('peticiones de intercambio', () => {
  it('cada acción con lo suyo', () => {
    expect(parseTradeRequest({ action: TradeAction.List, baseRevision: 3, offer: { kind: GoodKind.Shards, count: 2 }, ask })).not.toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Accept, baseRevision: 3, listingId: 'x', uid: null })).not.toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Accept, baseRevision: 3, listingId: 'x', uid: 'abc' })).not.toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Claim, baseRevision: 0, inboxId: 'y' })).not.toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Withdraw, listingId: 'x' })).not.toBeNull()
  })

  it('sin revisión, con ids vacíos o con ofertas raras, no', () => {
    expect(parseTradeRequest({ action: TradeAction.List, offer: { kind: GoodKind.Shards, count: 2 }, ask })).toBeNull()
    expect(parseTradeRequest({ action: TradeAction.List, baseRevision: 3, offer: { kind: GoodKind.Money, count: 2 }, ask })).toBeNull()
    expect(parseTradeRequest({ action: TradeAction.List, baseRevision: 3, offer: { kind: GoodKind.Pieces, speciesId: A, count: 1 }, ask: null })).toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Accept, baseRevision: 3, listingId: '', uid: null })).toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Accept, baseRevision: 3, listingId: 'x', uid: 5 })).toBeNull()
    expect(parseTradeRequest({ action: TradeAction.Claim, baseRevision: -1, inboxId: 'y' })).toBeNull()
    expect(parseTradeRequest({ action: 'steal' })).toBeNull()
  })
})
