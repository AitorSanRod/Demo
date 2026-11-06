import { describe, expect, it } from 'vitest'
import { STARTERS } from '../../data/species'
import { initialState, type GameState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { createMon } from '../team/mons'
import { BOX_SLOTS, ranchCount, RANCH_SLOTS, slotsOf } from '../team/ranches'
import { GoodKind, type TradeGood } from './tradeGoods'
import { DUPLICATE_BASE_PIECES, DUPLICATE_MONEY, DUPLICATE_PIECES_PER_STAR, receiveBlocker, receiveGood } from './tradeReceive'

const [A, B] = STARTERS

function game(): GameState {
  const s = initialState()
  chooseStarter(s, A)
  return s
}
const monGood = (speciesId: number, stars = 0): TradeGood => ({ kind: GoodKind.Mon, mon: { speciesId, level: 20, exp: 4, stars } })

/** Llena todos los ranchos y la Caja con Pokémon de la especie A (no importa repetir para ocupar sitio) */
function fillEverything(s: GameState) {
  for (let ranch = 0; ranch < ranchCount(s); ranch++) for (let i = 0; i < RANCH_SLOTS / slotsOf(A); i++) s.owned.push(createMon(A, 5, ranch))
  for (let i = 0; i < BOX_SLOTS; i++) s.owned.push(createMon(A, 5, null))
}

describe('recibir', () => {
  it('un Pokémon nuevo llega tal cual, con los PS al máximo, y cuenta como capturado', () => {
    const s = game()
    expect(receiveGood(s, monGood(B, 1))).toEqual({ good: monGood(B, 1), duplicate: null })
    const mon = s.owned.find((m) => m.speciesId === B)!
    expect(mon).toMatchObject({ level: 20, exp: 4, stars: 1, ranch: 0 })
    expect(mon.hp).toBeGreaterThan(0)
    expect(s.caught).toContain(B)
  })

  it('un Pokémon repetido se cambia por tickets de su especie (más por cada ★) y dinero', () => {
    const s = game()
    const money = s.money
    const result = receiveGood(s, monGood(A, 2))
    expect(result?.duplicate).toEqual({ speciesId: A, pieces: DUPLICATE_BASE_PIECES + 2 * DUPLICATE_PIECES_PER_STAR, money: DUPLICATE_MONEY })
    expect(s.owned.filter((m) => m.speciesId === A)).toHaveLength(1)
    expect(s.pieces[A]).toBe(DUPLICATE_BASE_PIECES + 2 * DUPLICATE_PIECES_PER_STAR)
    expect(s.money).toBe(money + DUPLICATE_MONEY)
  })

  it('sin sitio en los ranchos ni en la Caja, el Pokémon espera; lo demás sí se recoge', () => {
    const s = game()
    fillEverything(s)
    expect(receiveBlocker(s, monGood(B))).not.toBeNull()
    expect(receiveGood(s, monGood(B))).toBeNull()
    expect(receiveGood(s, monGood(A))?.duplicate).not.toBeNull()
    expect(receiveGood(s, { kind: GoodKind.Tickets, count: 3 })).not.toBeNull()
  })

  it('cantidades sueltas y tickets de una especie', () => {
    const s = game()
    const start = { money: s.money, tickets: s.tickets }
    receiveGood(s, { kind: GoodKind.Money, count: 50 })
    receiveGood(s, { kind: GoodKind.Tickets, count: 2 })
    receiveGood(s, { kind: GoodKind.Shards, count: 7 })
    receiveGood(s, { kind: GoodKind.Pieces, speciesId: B, count: 4 })
    expect(s).toMatchObject({ money: start.money + 50, tickets: start.tickets + 2, missingnoShards: 7, pieces: { [B]: 4 } })
  })
})
