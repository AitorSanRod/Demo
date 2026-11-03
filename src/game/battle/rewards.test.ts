import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { speciesOfRarity } from '../core/test-utils'
import {
  EXP_LEVEL_GAP,
  EXP_PER_LEVEL,
  expReward,
  MONEY_BONUS_RANGE,
  MONEY_PER_LEVEL,
  moneyReward,
  PIECE_DROP_CHANCE,
  pieceReward,
  TICKET_DROP_CHANCE,
  ticketReward,
} from './rewards'

const RARITIES = Object.values(Rarity)

describe('pieceReward', () => {
  it.each(RARITIES)('con rareza %s suelta pieza justo por debajo de su probabilidad', (rarity) => {
    const id = speciesOfRarity(rarity)
    expect(pieceReward(id, () => PIECE_DROP_CHANCE[rarity] - 0.001)).toBe(true)
    expect(pieceReward(id, () => PIECE_DROP_CHANCE[rarity])).toBe(false)
  })
})

describe('ticketReward', () => {
  it.each(RARITIES)('con rareza %s suelta ticket justo por debajo de su probabilidad', (rarity) => {
    const id = speciesOfRarity(rarity)
    expect(ticketReward(id, () => TICKET_DROP_CHANCE[rarity] - 0.001)).toBe(1)
    expect(ticketReward(id, () => TICKET_DROP_CHANCE[rarity])).toBe(0)
  })
})

describe('moneyReward', () => {
  it('da el nivel del rival por MONEY_PER_LEVEL más un extra dentro de MONEY_BONUS_RANGE', () => {
    const [min, max] = MONEY_BONUS_RANGE
    const level = 5
    expect(moneyReward(level, () => 0)).toBe(Math.ceil(level * MONEY_PER_LEVEL) + min)
    expect(moneyReward(level, () => 0.999)).toBe(Math.ceil(level * MONEY_PER_LEVEL) + max)
  })

  it('crece con el nivel del rival', () => {
    expect(moneyReward(10, () => 0)).toBeGreaterThan(moneyReward(2, () => 0))
  })
})

describe('expReward', () => {
  it('da EXP según el nivel del rival', () => {
    expect(expReward(10, 10)).toBe(10 * EXP_PER_LEVEL)
    expect(expReward(12, 10)).toBeGreaterThan(expReward(10, 10))
  })

  it(`no da EXP si el rival tiene más de ${EXP_LEVEL_GAP} niveles menos`, () => {
    expect(expReward(20 - EXP_LEVEL_GAP, 20)).toBeGreaterThan(0)
    expect(expReward(20 - EXP_LEVEL_GAP - 1, 20)).toBe(0)
  })
})
