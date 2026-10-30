import { describe, expect, it } from 'vitest'
import { signatureMove } from '../../data/moves'
import { POKEMON } from '../../data/pokemon'
import { SPECIES } from '../../data/species'
import { effectiveness } from '../../data/types'
import { seqRng } from '../core/test-utils'
import { calcStats } from '../team/stats'
import { makeFighter, simulateBattle } from './battle'

const LEVEL = 30
/** Primera pareja de especies en la que el ataque de una no afecta a la otra */
const IMMUNE = SPECIES.flatMap((a) =>
  SPECIES.filter((d) => effectiveness(signatureMove(a.id).type, d.types) === 0).map((d) => [a.id, d.id]),
)[0]
const BY_SPEED = [...SPECIES].sort((a, b) => calcStats(b.id, LEVEL).spe - calcStats(a.id, LEVEL).spe)


describe('simulateBattle', () => {
  it('un Pokémon muy superior gana', () => {
    const player = makeFighter('player', POKEMON.Charmander, 50)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 2)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.outcome).toBe('win')
    expect(result.events.at(-1)?.kind).toBe('faint')
  })

  it.runIf(IMMUNE)('un movimiento sin efecto nunca daña al rival', () => {
    const player = makeFighter('player', IMMUNE[0], 50)
    const enemy = makeFighter('enemy', IMMUNE[1], 50)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    const hitsOnEnemy = result.events.filter((e) => e.kind === 'hit' && e.side === 'enemy')
    expect(hitsOnEnemy).toHaveLength(0)
    expect(result.outcome).not.toBe('win')
  })

  it('el más rápido ataca primero', () => {
    const fast = makeFighter('player', BY_SPEED[0].id, LEVEL)
    const slow = makeFighter('enemy', BY_SPEED.at(-1)!.id, LEVEL)
    const result = simulateBattle(fast, slow, seqRng(0.5))
    expect(result.events.find((e) => e.kind === 'attack')?.side).toBe('player')
  })

  it('cada evento refleja los PS de ambos tras ocurrir', () => {
    const player = makeFighter('player', POKEMON.Charmander, 20)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 20)
    const result = simulateBattle(player, enemy, seqRng(0.3, 0.7))
    expect(result.events.at(-1)!.playerHp).toBe(result.playerHp)
  })
})
