import { describe, expect, it } from 'vitest'
import { wildMoves } from '../data/moves'
import { makeFighter, simulateBattle } from './battle'
import { seqRng } from './test-utils'

const CHARMANDER = 4
const BULBASAUR = 1
const RATTATA = 19
const GASTLY = 92

describe('simulateBattle', () => {
  it('un Pokémon muy superior gana', () => {
    const player = makeFighter('player', CHARMANDER, 50, { moves: ['flamethrower'] })
    const enemy = makeFighter('enemy', BULBASAUR, 2, { moves: wildMoves(BULBASAUR, 2) })
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.outcome).toBe('win')
    expect(result.events.at(-1)?.kind).toBe('faint')
  })

  it('un movimiento sin efecto nunca daña al rival', () => {
    const player = makeFighter('player', RATTATA, 50, { moves: ['tackle'] })
    const enemy = makeFighter('enemy', GASTLY, 50, { moves: wildMoves(GASTLY, 50) })
    const result = simulateBattle(player, enemy, seqRng(0.5))
    const hitsOnEnemy = result.events.filter((e) => e.kind === 'hit' && e.side === 'enemy')
    expect(hitsOnEnemy).toHaveLength(0)
    expect(result.outcome).not.toBe('win')
  })

  it('el más rápido ataca primero', () => {
    const fast = makeFighter('player', RATTATA, 30, { moves: ['tackle'] })
    const slow = makeFighter('enemy', BULBASAUR, 30, { moves: ['tackle'] })
    const result = simulateBattle(fast, slow, seqRng(0.5))
    expect(result.events.find((e) => e.kind === 'attack')?.side).toBe('player')
  })

  it('cada evento refleja los PS de ambos tras ocurrir', () => {
    const player = makeFighter('player', CHARMANDER, 20, { moves: ['ember'] })
    const enemy = makeFighter('enemy', BULBASAUR, 20, { moves: wildMoves(BULBASAUR, 20) })
    const result = simulateBattle(player, enemy, seqRng(0.3, 0.7))
    expect(result.events.at(-1)!.playerHp).toBe(result.playerHp)
  })
})
