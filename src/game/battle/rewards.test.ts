import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { speciesOfRarity } from '../core/test-utils'
import { PIECE_DROP_CHANCE, pieceReward, TICKET_DROP_CHANCE, ticketReward } from './rewards'

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
