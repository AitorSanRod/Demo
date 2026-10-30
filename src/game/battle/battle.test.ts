import { describe, expect, it } from 'vitest'
import { Pokemon } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { makeFighter, simulateBattle } from './battle'


describe('simulateBattle', () => {
  it('un Pokémon muy superior gana', () => {
    const player = makeFighter('player', Pokemon.Charmander, 50)
    const enemy = makeFighter('enemy', Pokemon.Bulbasaur, 2)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.outcome).toBe('win')
    expect(result.events.at(-1)?.kind).toBe('faint')
  })

  it('un movimiento sin efecto nunca daña al rival', () => {
    const player = makeFighter('player', Pokemon.Rattata, 50)
    const enemy = makeFighter('enemy', Pokemon.Gastly, 50)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    const hitsOnEnemy = result.events.filter((e) => e.kind === 'hit' && e.side === 'enemy')
    expect(hitsOnEnemy).toHaveLength(0)
    expect(result.outcome).not.toBe('win')
  })

  it('el más rápido ataca primero', () => {
    const fast = makeFighter('player', Pokemon.Rattata, 30)
    const slow = makeFighter('enemy', Pokemon.Bulbasaur, 30)
    const result = simulateBattle(fast, slow, seqRng(0.5))
    expect(result.events.find((e) => e.kind === 'attack')?.side).toBe('player')
  })

  it('cada evento refleja los PS de ambos tras ocurrir', () => {
    const player = makeFighter('player', Pokemon.Charmander, 20)
    const enemy = makeFighter('enemy', Pokemon.Bulbasaur, 20)
    const result = simulateBattle(player, enemy, seqRng(0.3, 0.7))
    expect(result.events.at(-1)!.playerHp).toBe(result.playerHp)
  })
})
