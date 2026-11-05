import { describe, expect, it } from 'vitest'
import { initialState } from '../core/state'
import { buyUpgrade, nextUpgradePrice, UPGRADES, upgradeLevel } from './upgrades'

const PRICE = UPGRADES.expeditionSlots.prices[0]

describe('buyUpgrade', () => {
  it('cobra el precio y sube el nivel', () => {
    const s = initialState()
    s.money = PRICE
    expect(buyUpgrade(s, 'expeditionSlots')).toBe(true)
    expect(s.money).toBe(0)
    expect(upgradeLevel(s, 'expeditionSlots')).toBe(1)
  })

  it('no compra sin dinero suficiente', () => {
    const s = initialState()
    s.money = PRICE - 1
    expect(buyUpgrade(s, 'expeditionSlots')).toBe(false)
    expect(upgradeLevel(s, 'expeditionSlots')).toBe(0)
  })

  it('no pasa del nivel máximo', () => {
    const s = initialState()
    const { prices } = UPGRADES.expeditionSlots
    s.money = prices.reduce((sum, p) => sum + p, 0) * 2
    for (let i = 0; i < prices.length + 2; i++) buyUpgrade(s, 'expeditionSlots')
    expect(upgradeLevel(s, 'expeditionSlots')).toBe(prices.length)
    expect(nextUpgradePrice(s, 'expeditionSlots')).toBeNull()
  })
})
