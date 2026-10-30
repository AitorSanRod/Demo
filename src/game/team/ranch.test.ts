import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { startRun } from '../run/run'
import { EXPEDITION_DURATIONS, sendExpedition } from './expedition'
import { healCost, healInstant, restInRanch, train } from './ranch'
import { maxHp } from './stats'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  return s
}

describe('rancho', () => {
  it('curar cuesta dinero y deja los PS al máximo', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    mon.hp = 1
    s.money = healCost(mon)
    expect(healInstant(s, mon.uid)).toBe(true)
    expect(mon.hp).toBe(maxHp(mon))
    expect(s.money).toBe(0)
  })

  it('no se puede curar ni entrenar a un Pokémon que está en ruta', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    startRun(s, RouteId.PuebloPaleta)
    mon.hp = 1
    expect(healInstant(s, mon.uid)).toBe(false)
    expect(train(s, mon.uid)).toBeNull()
  })

  it('los Pokémon de expedición no descansan', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    mon.hp = 5
    sendExpedition(s, mon.uid, RouteId.PuebloPaleta, EXPEDITION_DURATIONS[0])
    restInRanch(s, 60)
    expect(mon.hp).toBe(5)
  })
})
