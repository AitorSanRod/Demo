import { describe, expect, it, vi } from 'vitest'
import { legSteps, node, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { Potion, POTION_INFO } from '../../data/potions'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { advanceRun, startRun, tapRun, walk } from './run'
import { HEAL_STOP_MS, potionHeal } from './runHeal'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const HEAL_ROUTE = RouteId.MonteMoon

function stateOnHealRoute(hp: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.level = 50
  mon.hp = hp
  s.unlockedRoutes.push(HEAL_ROUTE)
  startRun(s, HEAL_ROUTE)
  return s
}

/** Llega a la parada `stop` del camino */
function walkTo(s: ReturnType<typeof stateOnHealRoute>, stop: number) {
  walk(s, legSteps(route(HEAL_ROUTE), s.run!.path, stop))
}

const potionAt = (s: ReturnType<typeof stateOnHealRoute>, stop: number) => node(route(HEAL_ROUTE), s.run!.path[stop]).potion!

describe('potionHeal', () => {
  it('una poción con PS fijos cura esos PS sin pasar del máximo', () => {
    const s = stateOnHealRoute(1)
    const mon = activeMon(s)!
    const amount = POTION_INFO[Potion.Potion].hp!
    expect(potionHeal(mon, Potion.Potion)).toBe(Math.min(amount, maxHp(mon) - 1))
    mon.hp = maxHp(mon) - 1
    expect(potionHeal(mon, Potion.Potion)).toBe(1)
  })

  it('la que no tiene PS fijos lo cura entero', () => {
    const s = stateOnHealRoute(1)
    expect(potionHeal(activeMon(s)!, Potion.FullRestore)).toBe(maxHp(activeMon(s)!) - 1)
  })
})

describe('parada de curación', () => {
  it('al llegar se cura con su poción, sin combate', () => {
    const s = stateOnHealRoute(1)
    const mon = activeMon(s)!
    const expected = potionHeal(mon, potionAt(s, 1))
    walkTo(s, 1)
    expect(mon.hp).toBe(1 + expected)
    expect(s.run!.heal).toMatchObject({ potion: potionAt(s, 1), hp: expected, msLeft: HEAL_STOP_MS })
    expect(s.run!.lastBattle).toBeNull()
    expect(s.run!.earned.battles).toBe(0)
  })

  it('se queda parado mientras se cura y después sigue caminando', () => {
    const s = stateOnHealRoute(1)
    walkTo(s, 1)
    expect(walk(s, 1)).toBe(0)
    tapRun(s)
    expect(s.run!.steps).toBe(0)
    advanceRun(s, HEAL_STOP_MS)
    expect(s.run!.heal).toBeNull()
    expect(s.run!.phase).toBe('walking')
    expect(walk(s, 1)).toBe(1)
  })

  it('en la última parada la ruta se completa al acabar la cura', () => {
    const s = stateOnHealRoute(1)
    const last = s.run!.path.length - 1
    walkTo(s, 1)
    advanceRun(s, HEAL_STOP_MS)
    walkTo(s, last)
    expect(s.run!.phase).toBe('walking')
    advanceRun(s, HEAL_STOP_MS)
    expect(s.run!.phase).toBe('complete')
    expect(activeMon(s)!.hp).toBe(maxHp(activeMon(s)!))
  })
})
