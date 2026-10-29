import { describe, expect, it } from 'vitest'
import { route } from '../data/maps'
import { chooseStarter, createMon } from './engine'
import {
  advanceExpeditions,
  collectExpedition,
  expeditionBattles,
  expeditionBlocker,
  expeditionWinRate,
  isExpeditionDone,
  sendExpedition,
} from './expedition'
import { runBlocker } from './run'
import { activeMon, initialState } from './state'
import { seqRng } from './test-utils'
import { buyUpgrade } from './upgrades'

function stateOnExpedition(durationMin = 60) {
  const s = initialState()
  chooseStarter(s, 1)
  const mon = activeMon(s)!
  sendExpedition(s, mon.uid, 'ruta-1', durationMin)
  return { s, mon }
}

describe('expediciones', () => {
  it('no se puede salir de ruta con el Pokémon que está de expedición', () => {
    const { s } = stateOnExpedition()
    expect(runBlocker(s)).toMatch(/expedición/)
  })

  it('solo acepta las duraciones previstas', () => {
    const { s } = stateOnExpedition(7)
    expect(s.expeditions).toHaveLength(0)
  })

  it('no se puede recoger antes de tiempo', () => {
    const { s, mon } = stateOnExpedition(60)
    advanceExpeditions(s, 30)
    expect(isExpeditionDone(s.expeditions[0])).toBe(false)
    expect(collectExpedition(s, mon.uid)).toBeNull()
  })

  it('al recogerla entrega el premio de los combates ganados y el Pokémon vuelve', () => {
    const { s, mon } = stateOnExpedition(60)
    mon.level = 50
    advanceExpeditions(s, 60)
    const money = s.money
    const result = collectExpedition(s, mon.uid, seqRng(0.5))!
    expect(result.battles).toBe(expeditionBattles(60))
    expect(result.wins).toBe(result.battles)
    expect(s.money).toBe(money + result.money)
    expect(result.exp).toBe(route('ruta-1').reward.exp)
    expect(s.expeditions).toHaveLength(0)
  })

  it('un Pokémon débil para la ruta tiene menos probabilidad de ganar', () => {
    const { mon } = stateOnExpedition()
    const r = route('ruta-marina')
    mon.level = 5
    const weak = expeditionWinRate(mon, r)
    mon.level = 20
    expect(weak).toBeLessThan(expeditionWinRate(mon, r))
  })


  it('sin mejoras solo cabe un Pokémon de expedición', () => {
    const { s } = stateOnExpedition()
    const second = createMon(16, 5)
    s.owned.push(second)
    expect(expeditionBlocker(s, second.uid)).toMatch(/huecos/)
    sendExpedition(s, second.uid, 'ruta-1', 60)
    expect(s.expeditions).toHaveLength(1)
  })

  it('la mejora de espacio permite uno más', () => {
    const { s } = stateOnExpedition()
    const second = createMon(16, 5)
    s.owned.push(second)
    s.money = 500
    buyUpgrade(s, 'expeditionSlots')
    sendExpedition(s, second.uid, 'ruta-1', 60)
    expect(s.expeditions).toHaveLength(2)
  })
})
