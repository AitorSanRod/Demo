import { describe, expect, it } from 'vitest'
import { CRIT_MULT, STATUS_INFO, StatusId, TYPE_PASSIVES } from '../../data/passives'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { calcStats } from '../team/stats'
import { makeFighter, simulateBattle } from './battle'
import { combineBonus } from './combatBonus'

const LEVEL = 30
const SPECIES_ID = POKEMON.Charmander
const RIVAL_ID = POKEMON.Bulbasaur

describe('combineBonus', () => {
  it('suma las pasivas y acumula sus estados', () => {
    const bonus = combineBonus([
      { type: 'fire', level: 1 },
      { type: 'electric', level: 2 },
    ])
    expect(bonus.atk).toBe(TYPE_PASSIVES.fire[0].atk)
    expect(bonus.spe).toBe(TYPE_PASSIVES.electric[1].spe)
    expect(bonus.inflicts).toEqual([TYPE_PASSIVES.fire[0].inflict, TYPE_PASSIVES.electric[1].inflict])
  })

  it('sin pasivas no cambia nada', () => {
    const plain = makeFighter('player', SPECIES_ID, LEVEL)
    expect(plain.stats).toEqual(calcStats(SPECIES_ID, LEVEL))
  })
})

describe('pasivas en combate', () => {
  it('las de stats suben la stat en su porcentaje, y los PS actuales en proporción', () => {
    const base = calcStats(SPECIES_ID, LEVEL)
    const f = makeFighter('player', SPECIES_ID, LEVEL, { hp: base.hp, passives: [{ type: 'normal', level: 1 }] })
    expect(f.maxHp).toBe(Math.round(base.hp * (1 + TYPE_PASSIVES.normal[0].hp!)))
    expect(f.hp).toBe(f.maxHp)
  })

  it('un golpe que acierta puede infligir un estado, y el estado se anuncia', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'fire', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    // 0.01: acierta, daño mínimo y siempre por debajo de la probabilidad de quemar
    const result = simulateBattle(player, enemy, seqRng(0.01))
    expect(result.events.some((e) => e.kind === 'status' && e.side === 'enemy' && e.status === StatusId.Burn)).toBe(true)
  })

  it('la quemadura quita PS al final de cada turno', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'fire', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    const result = simulateBattle(player, enemy, seqRng(0.01))
    const burnHits = result.events.filter((e) => e.kind === 'hit' && e.side === 'enemy' && e.status === StatusId.Burn)
    expect(burnHits.length).toBeGreaterThan(0)
    expect(STATUS_INFO.burn.damagePerTurn).toBeGreaterThan(0)
  })

  it('un congelado pierde su turno', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'ice', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    const result = simulateBattle(player, enemy, seqRng(0.01))
    expect(result.events.some((e) => e.kind === 'status' && e.side === 'enemy' && e.text.includes('congelado y no'))).toBe(true)
  })

  it('con esquiva segura el rival nunca le da', () => {
    const player = makeFighter('player', SPECIES_ID, LEVEL)
    player.bonus.dodge = 1
    const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.events.filter((e) => e.kind === 'hit' && e.side === 'player')).toHaveLength(0)
  })

  it('el crítico multiplica el daño', () => {
    const hitOf = (crit: number) => {
      const player = makeFighter('player', SPECIES_ID, LEVEL)
      player.bonus.crit = crit
      const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
      enemy.stats.spe = 1
      const result = simulateBattle(player, enemy, seqRng(0.5))
      const hit = result.events.findIndex((e) => e.kind === 'hit' && e.side === 'enemy')
      return enemy.maxHp - result.events[hit].enemyHp
    }
    expect(hitOf(1)).toBeGreaterThanOrEqual(Math.floor(hitOf(0) * CRIT_MULT) - 1)
    expect(hitOf(1)).toBeGreaterThan(hitOf(0))
  })

  it('la reducción de daño hace que reciba menos', () => {
    const lostWith = (reduction: number) => {
      const player = makeFighter('player', SPECIES_ID, LEVEL)
      player.bonus.damageReduction = reduction
      player.stats.spe = 1
      const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
      const result = simulateBattle(player, enemy, seqRng(0.5))
      const hit = result.events.find((e) => e.kind === 'hit' && e.side === 'player')!
      return player.maxHp - hit.playerHp
    }
    expect(lostWith(0.5)).toBeLessThan(lostWith(0))
  })

  it('el robo de vida cura al atacar', () => {
    const player = makeFighter('player', SPECIES_ID, LEVEL, { hp: 1, passives: [{ type: 'grass', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.events.some((e) => e.kind === 'heal' && e.side === 'player')).toBe(true)
  })
})
