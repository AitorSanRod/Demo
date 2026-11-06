import { describe, expect, it } from 'vitest'
import type { BattleEvent, BattleRecord } from '../battle/battle'
import { BATTLE_END_MS, BATTLE_EVENT_MS, battleDuration, battleMoment } from './battleTimeline'

const event = (kind: BattleEvent['kind']): BattleEvent => ({ kind, text: '', playerHp: 1, enemyHp: 1, playerStatus: null, enemyStatus: null })
const fighter = { speciesId: 1, name: '', level: 1, maxHp: 1 }
const KINDS: BattleEvent['kind'][] = ['info', 'attack', 'hit', 'faint']
const RECORD: BattleRecord = {
  player: fighter,
  enemy: fighter,
  events: KINDS.map(event),
  outcome: 'win',
  boss: false,
  rewards: { money: 0, tickets: 0, exp: 0, piece: false, moneyLost: 0 },
}
const total = battleDuration(RECORD)

describe('battleTimeline', () => {
  it('el combate dura lo de cada evento según su tipo más el final', () => {
    expect(total).toBe(KINDS.reduce((sum, k) => sum + BATTLE_EVENT_MS[k], 0) + BATTLE_END_MS)
  })

  it('al empezar se ve el primer evento entero por delante', () => {
    expect(battleMoment(RECORD, total)).toEqual({ index: 0, ended: false, msToNext: BATTLE_EVENT_MS[KINDS[0]] })
  })

  it('pasado el primer evento se ve el segundo', () => {
    const moment = battleMoment(RECORD, total - BATTLE_EVENT_MS[KINDS[0]])
    expect(moment.index).toBe(1)
    expect(moment.msToNext).toBe(BATTLE_EVENT_MS[KINDS[1]])
  })

  it('tras el último evento queda el final, con el último evento a la vista', () => {
    expect(battleMoment(RECORD, BATTLE_END_MS)).toEqual({ index: KINDS.length - 1, ended: true, msToNext: BATTLE_END_MS })
  })
})
