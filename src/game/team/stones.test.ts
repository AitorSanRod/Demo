import { describe, expect, it } from 'vitest'
import { STONE_IDS } from '../../data/stones'
import { initialState } from '../core/state'
import { buyStone, spendStone, STONE_PRICE, stonesOf } from './stones'

const STONE = STONE_IDS[0]

describe('piedras evolutivas', () => {
  it('se compran por su precio, sin límite, y se guardan', () => {
    const s = initialState()
    s.money = STONE_PRICE * 2
    expect(buyStone(s, STONE)).toBe(true)
    expect(buyStone(s, STONE)).toBe(true)
    expect(stonesOf(s, STONE)).toBe(2)
    expect(s.money).toBe(0)
  })

  it('sin ₽ suficientes no se compran', () => {
    const s = initialState()
    s.money = STONE_PRICE - 1
    expect(buyStone(s, STONE)).toBe(false)
    expect(stonesOf(s, STONE)).toBe(0)
  })

  it('se gastan de una en una y no se puede gastar la que no se tiene', () => {
    const s = initialState()
    expect(spendStone(s, STONE)).toBe(false)
    s.stones[STONE] = 1
    expect(spendStone(s, STONE)).toBe(true)
    expect(stonesOf(s, STONE)).toBe(0)
  })
})
