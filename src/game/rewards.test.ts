import { describe, expect, it } from 'vitest'
import { PIECE_DROP_CHANCE, pieceReward, TICKET_DROP_CHANCE, ticketReward } from './rewards'

const PIDGEY = 16
const MEWTWO = 150

describe('pieceReward', () => {
  it('la probabilidad de pieza depende de la rareza del salvaje', () => {
    expect(pieceReward(PIDGEY, () => PIECE_DROP_CHANCE.common - 0.001)).toBe(true)
    expect(pieceReward(PIDGEY, () => PIECE_DROP_CHANCE.common)).toBe(false)
    expect(pieceReward(MEWTWO, () => PIECE_DROP_CHANCE.legendary - 0.001)).toBe(true)
    expect(pieceReward(MEWTWO, () => PIECE_DROP_CHANCE.common - 0.001)).toBe(false)
  })
})

describe('ticketReward', () => {
  it('la probabilidad de ticket depende de la rareza del salvaje', () => {
    const between = (TICKET_DROP_CHANCE.common + TICKET_DROP_CHANCE.legendary) / 2
    expect(ticketReward(PIDGEY, () => between)).toBe(0)
    expect(ticketReward(MEWTWO, () => between)).toBe(1)
  })

  it('los raros sueltan tickets más a menudo que los comunes', () => {
    expect(TICKET_DROP_CHANCE.rare).toBeGreaterThan(TICKET_DROP_CHANCE.common)
    expect(TICKET_DROP_CHANCE.epic).toBeGreaterThan(TICKET_DROP_CHANCE.rare)
    expect(TICKET_DROP_CHANCE.legendary).toBeGreaterThan(TICKET_DROP_CHANCE.epic)
  })
})
