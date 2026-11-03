import { describe, expect, it, vi } from 'vitest'
import { NodeKind, route, RouteId } from '../../data/maps'
import { activeMon, initialState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { startRun, walk } from '../run/run'
import { RAID_ROUND_MS } from './raidCombat'
import { RaidMemberKind } from './raidRoom'
import {
  advanceRouteRaid,
  currentRouteRaid,
  retreatRouteRaid,
  ROUTE_RAID_FIRST_BOT_MS,
  ROUTE_RAID_JOIN_MIN_HP,
  ROUTE_RAID_RUNNING_CHANCE,
} from './routeRaid'
import { sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const RAID_ROUTE = RouteId.BosqueVerde
const raidNode = () => route(RAID_ROUTE).nodes.find((n) => n.kind === NodeKind.Raid)!
const NEW_ROOM = seqRng(ROUTE_RAID_RUNNING_CHANCE + (1 - ROUTE_RAID_RUNNING_CHANCE) / 2)
const RUNNING_ROOM = seqRng(0)

/** Ruta en marcha que acaba de llegar a la parada del jefe comunitario, con un Pokémon que puede herirle */
function arriveAtRaid(rng = NEW_ROOM) {
  const s = initialState()
  chooseStarter(s, sparringSpecies(raidNode().boss!.speciesId))
  s.unlockedRoutes.push(RAID_ROUTE)
  startRun(s, RAID_ROUTE)
  walk(s, Number.MAX_SAFE_INTEGER, rng)
  return { s, mon: activeMon(s)!, raid: currentRouteRaid(s)! }
}

describe('jefe comunitario de ruta', () => {
  it('al llegar a la parada la ruta se para y empieza la pelea en una sala de esa parada', () => {
    const { s, mon, raid } = arriveAtRaid()
    expect(s.run!.phase).toBe('raid')
    expect(raid.place).toEqual({ routeId: RAID_ROUTE, nodeId: raidNode().id })
    expect(raid.boss).toEqual(raidNode().boss)
    expect(raid.members.map((m) => m.id)).toEqual([mon.uid])
    expect(raid.hp).toBe(raid.maxHp)
  })

  it('a veces se llega a una sala ya en marcha, con gente dentro y el jefe por encima del mínimo', () => {
    const { raid, mon } = arriveAtRaid(RUNNING_ROOM)
    expect(raid.members.filter((m) => m.id !== mon.uid).length).toBeGreaterThan(0)
    expect(raid.hp).toBeGreaterThan(raid.maxHp * ROUTE_RAID_JOIN_MIN_HP)
    expect(raid.hp).toBeLessThanOrEqual(raid.maxHp)
  })

  it('en una sala nueva el primer bot entra justo a los ROUTE_RAID_FIRST_BOT_MS', () => {
    const { s, raid } = arriveAtRaid()
    const nobodyElseJoins = seqRng(0.9999)
    advanceRouteRaid(s, ROUTE_RAID_FIRST_BOT_MS - 1, nobodyElseJoins)
    expect(raid.members).toHaveLength(1)
    advanceRouteRaid(s, 2, nobodyElseJoins)
    expect(raid.members).toHaveLength(2)
    expect(raid.members[1].kind).toBe(RaidMemberKind.Bot)
  })

  it('al caer el jefe se completa la ruta y su premio va a lo ganado en ella, no a la pestaña Jefes', () => {
    const { s, raid } = arriveAtRaid()
    const money = s.money
    raid.hp = 1
    advanceRouteRaid(s, RAID_ROUND_MS, seqRng(0))
    const run = s.run!
    expect(run.phase).toBe('complete')
    expect(run.raid).toBeNull()
    expect(s.completedRoutes).toContain(RAID_ROUTE)
    expect(run.earned.raidBosses).toEqual([raid.boss.speciesId])
    expect(run.earned.money).toBeGreaterThan(0)
    expect(s.money).toBe(money + run.earned.money)
    expect(s.raidPrizes).toHaveLength(0)
  })

  it('retirarse es una derrota y no da el premio del jefe', () => {
    const { s } = arriveAtRaid()
    retreatRouteRaid(s)
    expect(s.run!.phase).toBe('fainted')
    expect(s.run!.raid).toBeNull()
    expect(s.run!.earned.raidBosses).toHaveLength(0)
    expect(s.raidPrizes).toHaveLength(0)
  })
})
