import { describe, expect, it } from 'vitest'
import { DAILY_GIFTS } from '../../data/dailyGifts'
import { initialState } from '../core/state'
import { applyGift, canClaimGift, claimGift, DAILY_GIFT_INTERVAL_MS, giftAt, giftAvailableAt, noGiftsYet } from './dailyGift'

const T0 = 1_000_000

describe('obsequio diario', () => {
  it('el primero se puede recoger enseguida y es el primero de la lista', () => {
    const st = noGiftsYet()
    expect(canClaimGift(st, T0)).toBe(true)
    expect(claimGift(st, T0)).toEqual(DAILY_GIFTS[0])
  })

  it('después hay que esperar DAILY_GIFT_INTERVAL_MS para el siguiente', () => {
    const st = noGiftsYet()
    claimGift(st, T0)
    expect(claimGift(st, T0 + DAILY_GIFT_INTERVAL_MS - 1)).toBeNull()
    expect(giftAvailableAt(st)).toBe(T0 + DAILY_GIFT_INTERVAL_MS)
    expect(claimGift(st, T0 + DAILY_GIFT_INTERVAL_MS)).toEqual(DAILY_GIFTS[1 % DAILY_GIFTS.length])
  })

  it('aunque pasen muchos días sin entrar, toca el siguiente de la lista (no se reinicia)', () => {
    const st = noGiftsYet()
    claimGift(st, T0)
    expect(claimGift(st, T0 + 30 * DAILY_GIFT_INTERVAL_MS)).toEqual(DAILY_GIFTS[1 % DAILY_GIFTS.length])
  })

  it('al acabar la lista vuelve a empezar', () => {
    const st = noGiftsYet()
    for (let day = 0; day < DAILY_GIFTS.length; day++) claimGift(st, T0 + day * DAILY_GIFT_INTERVAL_MS)
    expect(giftAt(st.claimed)).toEqual(DAILY_GIFTS[0])
  })

  it('al recogerlo se suman a la partida el dinero, los trozos y los tickets', () => {
    const s = initialState()
    const before = { money: s.money, shards: s.missingnoShards, tickets: s.tickets }
    const gift = { money: 7, missingnoShards: 5, tickets: 3, big: false }
    applyGift(s, gift)
    expect({ money: s.money, shards: s.missingnoShards, tickets: s.tickets }).toEqual({
      money: before.money + gift.money,
      shards: before.shards + gift.missingnoShards,
      tickets: before.tickets + gift.tickets,
    })
  })
})
