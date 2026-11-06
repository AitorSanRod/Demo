import { describe, expect, it } from 'vitest'
import { STARTERS } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { createMon } from '../team/mons'
import { GoodKind } from './tradeGoods'
import { applyTradeOp, TradeOpKind } from './tradeOps'

const [A, B] = STARTERS

describe('operaciones de intercambio', () => {
  it('cada una que sale bien sube el sello; las que no, no tocan nada', () => {
    const s = initialState()
    chooseStarter(s, A)
    const mon = createMon(B, 8)
    s.owned.push(mon)
    s.money = 30

    expect(applyTradeOp(s, { kind: TradeOpKind.Pay, ask: { kind: GoodKind.Money, count: 31 }, uid: null })).toBeNull()
    expect(s.tradeStamp).toBe(0)

    expect(applyTradeOp(s, { kind: TradeOpKind.List, offer: { kind: GoodKind.Mon, uid: mon.uid } })?.good).toMatchObject({ mon: { speciesId: B } })
    expect(applyTradeOp(s, { kind: TradeOpKind.Pay, ask: { kind: GoodKind.Money, count: 30 }, uid: null })?.good).toEqual({ kind: GoodKind.Money, count: 30 })
    expect(applyTradeOp(s, { kind: TradeOpKind.Claim, good: { kind: GoodKind.Tickets, count: 1 } })).not.toBeNull()
    expect(s.tradeStamp).toBe(3)
  })

  it('el mismo cambio sobre dos copias iguales deja las dos iguales (servidor y móvil)', () => {
    const s = initialState()
    chooseStarter(s, A)
    s.owned.push(createMon(B, 8))
    const copy = structuredClone(s)
    const op = { kind: TradeOpKind.List, offer: { kind: GoodKind.Mon, uid: s.owned[1].uid } } as const
    applyTradeOp(s, op)
    applyTradeOp(copy, op)
    expect(copy).toEqual(s)
  })
})
