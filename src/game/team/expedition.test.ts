import { describe, expect, it, vi } from 'vitest'
import { route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { seqRng } from '../core/test-utils'
import { runBlocker } from '../run/run'
import {
  advanceExpeditions,
  collectExpedition,
  DISCOVERY_CHANCE,
  EXPEDITION_DURATIONS,
  expeditionBattles,
  expeditionBlocker,
  expeditionRewardMult,
  expeditionWinRate,
  isExpeditionDone,
  sendExpedition,
} from './expedition'
import { createMon } from './mons'
import { buyUpgrade, UPGRADES } from './upgrades'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const DURATION = EXPEDITION_DURATIONS[0]
const INVALID_DURATION = Math.max(...EXPEDITION_DURATIONS) + 1

function stateOnExpedition(durationMin = DURATION) {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  const mon = activeMon(s)!
  sendExpedition(s, mon.uid, RouteId.PuebloPaleta, durationMin)
  return { s, mon }
}

describe('expediciones', () => {
  it('no se puede salir de ruta con el Pokémon que está de expedición', () => {
    const { s } = stateOnExpedition()
    expect(runBlocker(s)).toMatch(/expedición/)
  })

  it('solo acepta las duraciones previstas', () => {
    const { s } = stateOnExpedition(INVALID_DURATION)
    expect(s.expeditions).toHaveLength(0)
  })

  it('no se puede recoger antes de tiempo', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION / 2)
    expect(isExpeditionDone(s.expeditions[0])).toBe(false)
    expect(collectExpedition(s, mon.uid)).toBeNull()
  })

  it('al recogerla entrega el premio de los combates ganados y el Pokémon vuelve', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    mon.level = 50
    advanceExpeditions(s, DURATION)
    const money = s.money
    const result = collectExpedition(s, mon.uid, seqRng(0.5))!
    expect(result.battles).toBe(expeditionBattles(DURATION))
    expect(result.wins).toBe(result.battles)
    expect(s.money).toBe(money + result.money)
    expect(result.exp).toBe(route(RouteId.PuebloPaleta).reward.exp)
    expect(s.expeditions).toHaveLength(0)
  })

  it('los salvajes derrotados pueden soltar piezas, que se suman a la colección', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION)
    // Con rng muy bajo se gana cada combate y cada salvaje suelta pieza
    const result = collectExpedition(s, mon.uid, () => 0.001)!
    expect(result.pieces).toHaveLength(result.battles)
    const id = result.pieces[0]
    expect(s.pieces[id]).toBe(result.pieces.filter((p) => p === id).length)
  })

  it.each(EXPEDITION_DURATIONS)('multiplica EXP, ₽, tickets y piezas según la duración (%i min)', (duration) => {
    const { s, mon } = stateOnExpedition(duration)
    mon.level = 50
    advanceExpeditions(s, duration)
    const mult = expeditionRewardMult(duration)
    const result = collectExpedition(s, mon.uid, () => 0.001)!
    expect(result.exp).toBe(route(RouteId.PuebloPaleta).reward.exp * mult)
    expect(result.tickets).toBe(result.battles * mult)
    expect(result.pieces).toHaveLength(result.battles * mult)
    expect(result.money % mult).toBe(0)
  })

  it('la expedición más larga rinde mucho más por minuto', () => {
    expect(expeditionRewardMult(240)).toBe(4)
    expect(expeditionRewardMult(60)).toBe(2)
    expect(expeditionRewardMult(15)).toBe(1)
  })

  it('descubre especies no vistas según su probabilidad y las anuncia una sola vez', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION)
    const result = collectExpedition(s, mon.uid, () => 0.001)!
    expect(result.discovered).toHaveLength(new Set(result.discovered).size)
    expect(result.discovered.length).toBeGreaterThan(0)
    for (const id of result.discovered) expect(s.seen).toContain(id)
  })

  it('sin superar la probabilidad no descubre nada, aunque suelte piezas', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    mon.level = 50
    advanceExpeditions(s, DURATION)
    const seen = [...s.seen]
    // Encima de todas las probabilidades de descubrimiento: gana igualmente porque su tasa es 1
    const result = collectExpedition(s, mon.uid, () => 0.5)!
    expect(result.discovered).toEqual([])
    expect(s.seen).toEqual(seen)
  })

  it('las probabilidades de descubrimiento bajan con la rareza', () => {
    expect(DISCOVERY_CHANCE).toEqual({ common: 0.15, rare: 0.1, epic: 0.075, legendary: 0.05 })
  })

  it('un Pokémon débil para la ruta tiene menos probabilidad de ganar', () => {
    const { mon } = stateOnExpedition()
    const r = route(RouteId.Ruta1)
    mon.level = 2
    const weak = expeditionWinRate(mon, r)
    mon.level = 20
    expect(weak).toBeLessThan(expeditionWinRate(mon, r))
  })


  it('sin mejoras solo cabe un Pokémon de expedición', () => {
    const { s } = stateOnExpedition()
    const second = createMon(POKEMON.Pidgey, 5)
    s.owned.push(second)
    expect(expeditionBlocker(s, second.uid)).toMatch(/huecos/)
    sendExpedition(s, second.uid, RouteId.PuebloPaleta, DURATION)
    expect(s.expeditions).toHaveLength(1)
  })

  it('la mejora de espacio permite uno más', () => {
    const { s } = stateOnExpedition()
    const second = createMon(POKEMON.Pidgey, 5)
    s.owned.push(second)
    s.money = UPGRADES.expeditionSlots.prices[0]
    buyUpgrade(s, 'expeditionSlots')
    sendExpedition(s, second.uid, RouteId.PuebloPaleta, DURATION)
    expect(s.expeditions).toHaveLength(2)
  })
})
