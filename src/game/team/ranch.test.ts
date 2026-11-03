import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { startRun } from '../run/run'
import { EXPEDITION_DURATIONS, sendExpedition } from './expedition'
import { healCost, healInstant, maxTrainSessions, restInRanch, train, trainCost, trainPlan } from './ranch'
import { MAX_LEVEL, maxHp } from './stats'

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

  it('la vista previa de varias sesiones coincide con lo que pasa al aceptarlas', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    const plan = trainPlan(mon, 4)
    expect(plan.levelsGained).toBeGreaterThan(0)
    expect(mon.level).toBe(plan.level - plan.levelsGained)
    s.money = plan.cost
    expect(train(s, mon.uid, 4)).toEqual({ levelsGained: plan.levelsGained })
    expect([mon.level, mon.exp, s.money]).toEqual([plan.level, plan.exp, 0])
  })

  it('cada sesión cuesta según el nivel que tiene al empezarla', () => {
    const mon = activeMon(stateWithStarter())!
    const first = trainCost(mon)
    // Una sesión más de las que hacen falta para subir de nivel: esa ya se cobra al nivel nuevo
    let sessions = 1
    while (trainPlan(mon, sessions).levelsGained === 0) sessions++
    expect(trainPlan(mon, sessions + 1).cost).toBeGreaterThan(first * (sessions + 1))
  })

  it('el precio de una sesión sube cada nivel más que el anterior', () => {
    const mon = activeMon(stateWithStarter())!
    const costAt = (level: number) => trainCost({ ...mon, level })
    const steps = [10, 11, 12].map((level) => costAt(level + 1) - costAt(level))
    expect(steps[1]).toBeGreaterThan(steps[0])
    expect(steps[2]).toBeGreaterThan(steps[1])
  })

  it('solo deja entrenar las sesiones que se pueden pagar', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    s.money = trainPlan(mon, 2).cost
    expect(maxTrainSessions(s, mon.uid)).toBe(2)
    expect(train(s, mon.uid, 3)).toBeNull()
    expect(s.money).toBe(trainPlan(mon, 2).cost)
  })

  it('no entrena por encima del nivel máximo', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    mon.level = MAX_LEVEL
    s.money = 1e9
    expect(maxTrainSessions(s, mon.uid)).toBe(0)
    expect(train(s, mon.uid)).toBeNull()
  })
})
