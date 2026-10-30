import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { initialState } from '../core/state'
import { seqRng } from '../core/test-utils'
import { buyTicket, PIECES_PER_PULL, pull, TICKET_PRICE } from './gacha'
import { piecesOf } from './pieces'

// rng = 0 siempre cae en la primera especie legendaria; 0.99 cae en común
const LEGENDARY = seqRng(0)
const COMMON = seqRng(0.99)

describe('pull', () => {
  it('no permite tirar sin tickets', () => {
    const s = initialState()
    s.tickets = 0
    expect(pull(s, 1, LEGENDARY)).toEqual([])
    expect(s.pieces).toEqual({})
  })

  it('cada tirada gasta un ticket y da 5 piezas', () => {
    const s = initialState()
    const before = s.tickets
    const drops = pull(s, 1, COMMON)
    expect(drops).toHaveLength(PIECES_PER_PULL)
    expect(s.tickets).toBe(before - 1)
  })

  it('las piezas se suman por especie y la marcan como vista, no como capturada', () => {
    const s = initialState()
    const [drop] = pull(s, 1, LEGENDARY)
    expect(drop.rarity).toBe(Rarity.Legendary)
    expect(piecesOf(s, drop.speciesId)).toBe(PIECES_PER_PULL)
    expect(s.seen).toContain(drop.speciesId)
    expect(s.caught).not.toContain(drop.speciesId)
    expect(s.owned).toHaveLength(0)
  })

  it('tira varias veces mientras queden tickets', () => {
    const s = initialState()
    s.tickets = 2
    expect(pull(s, 10, COMMON)).toHaveLength(2 * PIECES_PER_PULL)
    expect(s.tickets).toBe(0)
  })
})

describe('buyTicket', () => {
  it('cambia pokécuartos por un ticket', () => {
    const s = initialState()
    s.money = TICKET_PRICE
    buyTicket(s)
    expect(s.money).toBe(0)
    expect(s.tickets).toBe(initialState().tickets + 1)
  })

  it('no hace nada si no hay dinero suficiente', () => {
    const s = initialState()
    s.money = TICKET_PRICE - 1
    buyTicket(s)
    expect(s.money).toBe(TICKET_PRICE - 1)
  })
})
