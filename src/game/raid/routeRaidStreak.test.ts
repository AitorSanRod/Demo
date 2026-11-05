import { describe, expect, it, vi } from 'vitest'
import { NodeKind, pathFrom, route, RouteId } from '../../data/maps'
import { initialState, type GameState } from '../core/state'
import type { RaidPlace } from './raidRoom'
import {
  pathRaidMoneyMult,
  recordRouteRaidFall,
  ROUTE_RAID_MIN_MONEY_MULT,
  ROUTE_RAID_REPEAT_MONEY_MULT,
  ROUTE_RAID_STREAK_RESET_MS,
  routeRaidMoneyMult,
} from './routeRaidStreak'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const RAID_ROUTE = RouteId.BosqueVerde
const PLACE: RaidPlace = { routeId: RAID_ROUTE, nodeId: route(RAID_ROUTE).nodes.find((n) => n.kind === NodeKind.Raid)!.id }
const OTHER: RaidPlace = { routeId: RouteId.Ruta1, nodeId: 'otra' }

/** Partida con `times` victorias seguidas contra el jefe de PLACE, separadas por `gapMs`; devuelve la hora de la última */
function fallsInARow(s: GameState, times: number, gapMs = 0): number {
  let now = 0
  for (let i = 0; i < times; i++) recordRouteRaidFall(s, PLACE, (now = i * gapMs))
  return now
}

describe('racha del jefe de una parada', () => {
  it('la primera vez da todo el dinero', () => {
    expect(routeRaidMoneyMult(initialState(), PLACE, 0)).toBe(1)
  })

  it('cada victoria seguida multiplica el dinero por ROUTE_RAID_REPEAT_MONEY_MULT', () => {
    const s = initialState()
    const last = fallsInARow(s, 2)
    expect(routeRaidMoneyMult(s, PLACE, last)).toBeCloseTo(ROUTE_RAID_REPEAT_MONEY_MULT ** 2)
  })

  it('nunca baja de ROUTE_RAID_MIN_MONEY_MULT', () => {
    const s = initialState()
    const last = fallsInARow(s, 50)
    expect(routeRaidMoneyMult(s, PLACE, last)).toBe(ROUTE_RAID_MIN_MONEY_MULT)
  })

  it('si pasa ROUTE_RAID_STREAK_RESET_MS sin derrotarlo, vuelve a dar todo y la racha empieza de nuevo', () => {
    const s = initialState()
    const last = fallsInARow(s, 3)
    expect(routeRaidMoneyMult(s, PLACE, last + ROUTE_RAID_STREAK_RESET_MS - 1)).toBeLessThan(1)
    expect(routeRaidMoneyMult(s, PLACE, last + ROUTE_RAID_STREAK_RESET_MS)).toBe(1)
    recordRouteRaidFall(s, PLACE, last + ROUTE_RAID_STREAK_RESET_MS)
    expect(routeRaidMoneyMult(s, PLACE, last + ROUTE_RAID_STREAK_RESET_MS)).toBe(ROUTE_RAID_REPEAT_MONEY_MULT)
  })

  it('victorias separadas por menos de ROUTE_RAID_STREAK_RESET_MS siguen contando como seguidas', () => {
    const s = initialState()
    const last = fallsInARow(s, 3, ROUTE_RAID_STREAK_RESET_MS - 1)
    expect(routeRaidMoneyMult(s, PLACE, last)).toBeCloseTo(ROUTE_RAID_REPEAT_MONEY_MULT ** 3)
  })

  it('cada parada lleva su propia racha', () => {
    const s = initialState()
    fallsInARow(s, 3)
    expect(routeRaidMoneyMult(s, OTHER, 0)).toBe(1)
  })

  it('el camino de la ruta dice la rebaja de su jefe, y 1 si no tiene', () => {
    const s = initialState()
    const last = fallsInARow(s, 1)
    expect(pathRaidMoneyMult(s, route(RAID_ROUTE), pathFrom(route(RAID_ROUTE)), last)).toBe(ROUTE_RAID_REPEAT_MONEY_MULT)
    expect(pathRaidMoneyMult(s, route(RouteId.PuebloPaleta), pathFrom(route(RouteId.PuebloPaleta)), last)).toBe(1)
  })
})
