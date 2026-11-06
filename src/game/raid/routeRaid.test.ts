import { describe, expect, it, vi } from 'vitest'
import { NodeKind, route, RouteId } from '../../data/maps'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { advanceRun, startRun, walk } from '../run/run'
import { maxHp } from '../team/stats'
import { RAID_ROUND_MS } from './raidCombat'
import { isEnding, RAID_ENDING_MS } from './raidEnding'
import { RaidMemberKind } from './raidRoom'
import {
  advanceRouteRaid,
  currentRouteRaid,
  retreatRouteRaid,
  ROUTE_RAID_LIVES,
  ROUTE_RAID_RUNNING_CHANCE,
  ROUTE_RAID_SEARCH_MS,
} from './routeRaid'
import { recordRouteRaidFall, ROUTE_RAID_REPEAT_MONEY_MULT } from './routeRaidStreak'
import { ROUTE_RAID_FIRST_BOT_MS, ROUTE_RAID_JOIN_MIN_HP } from './stopRoom'
import { sparringSpecies } from './raid-test-utils'
import { dropLink } from './online/linkedRoom'
import { RoomSlot } from './online/protocol'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const RAID_ROUTE = RouteId.BosqueVerde
const raidNode = () => route(RAID_ROUTE).nodes.find((n) => n.kind === NodeKind.Raid)!
const NEW_ROOM = seqRng(ROUTE_RAID_RUNNING_CHANCE + (1 - ROUTE_RAID_RUNNING_CHANCE) / 2)
const RUNNING_ROOM = seqRng(0)

/** Llega a la parada del jefe comunitario, con un Pokémon que puede herirle, y sigue buscando sala en el servidor */
function arriveSearching(rng = NEW_ROOM) {
  const s = initialState()
  chooseStarter(s, sparringSpecies(raidNode().boss!.speciesId))
  s.unlockedRoutes.push(RAID_ROUTE)
  startRun(s, RAID_ROUTE)
  walk(s, Number.MAX_SAFE_INTEGER, rng)
  return { s, mon: activeMon(s)!, raid: currentRouteRaid(s)! }
}

/** Llega a la parada sin servidor: la sala se juega en local, con bots */
function arriveAtRaid(rng = NEW_ROOM) {
  const arrived = arriveSearching(rng)
  dropLink(arrived.s, RoomSlot.Route)
  return arrived
}

/** El Pokémon del jugador cae en la próxima ronda y era su última vida */
function loseLastLife(s: GameState) {
  const me = currentRouteRaid(s)!.members.find((m) => m.id === activeMon(s)!.uid)!
  Object.assign(me, { lives: 1, hpFraction: Number.MIN_VALUE })
  advanceRouteRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
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

  it('al llegar busca primero sala en el servidor y, mientras, la sala local no se mueve ni entran bots', () => {
    const { s, raid } = arriveSearching()
    const before = structuredClone(raid)
    expect(advanceRouteRaid(s, ROUTE_RAID_SEARCH_MS, seqRng(0))).toBe(ROUTE_RAID_SEARCH_MS)
    expect(s.run!.raid).toEqual(before)
  })

  it('si la búsqueda se salta más de ROUTE_RAID_SEARCH_MS (app cerrada u oculta), la sala se juega en local', () => {
    const { s } = arriveSearching()
    advanceRouteRaid(s, ROUTE_RAID_SEARCH_MS + ROUTE_RAID_FIRST_BOT_MS * 10, seqRng(0))
    const raid = currentRouteRaid(s)!
    expect(raid.remote).toBeNull()
    expect(raid.members.some((m) => m.kind === RaidMemberKind.Bot)).toBe(true)
  })

  it('la pelea gasta solo su tiempo: lo que sobra, en el mismo avance, sigue la ruta', () => {
    const { s, raid } = arriveAtRaid()
    raid.hp = 1
    const run = s.run!
    // Como si la parada no fuera la última: al caer el jefe hay más ruta por andar
    run.stop = 0
    advanceRun(s, RAID_ROUND_MS * 2 + RAID_ENDING_MS, seqRng(0))
    expect(run.earned.raidBosses).toEqual([raid.boss.speciesId])
    expect(run.phase).toBe('walking')
    expect(run.steps).toBeGreaterThan(0)
  })

  it('si no hay servidor, la sala local se juega y entran bots', () => {
    const { s, raid } = arriveAtRaid()
    advanceRouteRaid(s, ROUTE_RAID_FIRST_BOT_MS * 10, seqRng(0))
    expect(raid.members.some((m) => m.kind === RaidMemberKind.Bot)).toBe(true)
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

  it('al caer el jefe se completa la ruta y su premio va a lo ganado en ella, no a la pestaña Raids', () => {
    const { s, raid } = arriveAtRaid()
    const money = s.money
    raid.hp = 1
    advanceRouteRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
    const run = s.run!
    expect(run.phase).toBe('complete')
    expect(run.raid).toBeNull()
    expect(s.completedRoutes).toContain(RAID_ROUTE)
    expect(run.earned.raidBosses).toEqual([raid.boss.speciesId])
    expect(run.earned).toMatchObject({ wins: 1, battles: 1 })
    expect(run.earned.money).toBeGreaterThan(0)
    expect(s.money).toBe(money + run.earned.money)
    expect(s.raidPrizes).toHaveLength(0)
  })

  it('al caer el jefe se apunta en su racha; si venía de otra seguida, su dinero se rebaja', () => {
    const { s, raid } = arriveAtRaid()
    recordRouteRaidFall(s, raid.place!, s.lastTick)
    raid.hp = 1
    advanceRouteRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
    expect(s.run!.earned.raidMoneyMult).toBe(ROUTE_RAID_REPEAT_MONEY_MULT)
    expect(s.routeRaidStreaks).not.toEqual({})
  })

  it('el Pokémon entra con ROUTE_RAID_LIVES vidas y pierde una cada vez que cae', () => {
    const { s, mon, raid } = arriveAtRaid()
    const me = raid.members.find((m) => m.id === mon.uid)!
    expect(me.lives).toBe(ROUTE_RAID_LIVES)
    me.hpFraction = Number.MIN_VALUE
    advanceRouteRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(me.lives).toBe(ROUTE_RAID_LIVES - 1)
    expect(s.run!.phase).toBe('raid')
  })

  it('al gastar sus vidas vuelve al principio de la ruta, recuperado y con lo ganado, recordando la vida del jefe', () => {
    const { s, mon, raid } = arriveAtRaid()
    raid.hp = Math.round(raid.maxHp / 2)
    s.run!.earned.money = 1
    loseLastLife(s)
    const run = s.run!
    expect(run).toMatchObject({ phase: 'walking', stop: 0, steps: 0, raid: null, raidRejoinHp: raid.hp / raid.maxHp })
    expect(run.earned.money).toBe(1)
    expect(mon.hp).toBe(maxHp(mon))
    expect(raid.members.find((m) => m.id === mon.uid)!.left).toBe(true)
  })

  it('al volver a la parada se reengancha a una sala en marcha con el jefe como lo dejó', () => {
    const { s, raid } = arriveAtRaid()
    raid.hp = Math.round(raid.maxHp * (ROUTE_RAID_JOIN_MIN_HP + 1) / 2)
    loseLastLife(s)
    const rejoin = s.run!.raidRejoinHp!
    walk(s, Number.MAX_SAFE_INTEGER, NEW_ROOM)
    const again = currentRouteRaid(s)!
    expect(again).not.toBe(raid)
    expect(again.hp).toBe(Math.round(again.maxHp * rejoin))
    expect(again.members.length).toBeGreaterThan(1)
    expect(s.run!.raidRejoinHp).toBeNull()
  })

  it('si el jefe estaba por debajo del mínimo para unirse, entra en la sala más cercana que lo permite', () => {
    const { s, raid } = arriveAtRaid()
    raid.hp = Math.round((raid.maxHp * ROUTE_RAID_JOIN_MIN_HP) / 2)
    loseLastLife(s)
    expect(s.run!.raidRejoinHp).toBeLessThan(ROUTE_RAID_JOIN_MIN_HP)
    walk(s, Number.MAX_SAFE_INTEGER, NEW_ROOM)
    const again = currentRouteRaid(s)!
    expect(again.hp).toBe(Math.floor(again.maxHp * ROUTE_RAID_JOIN_MIN_HP) + 1)
  })

  it('al caer el jefe la ruta espera a que se vea el final, y mientras no se puede retirar', () => {
    const { s, raid } = arriveAtRaid()
    raid.hp = 1
    advanceRouteRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(isEnding(raid)).toBe(true)
    retreatRouteRaid(s)
    advanceRouteRaid(s, RAID_ENDING_MS - 1, seqRng(0))
    expect(s.run!.phase).toBe('raid')
    expect(s.run!.earned.raidBosses).toHaveLength(0)
    advanceRouteRaid(s, 1, seqRng(0))
    expect(s.run!.earned.raidBosses).toEqual([raid.boss.speciesId])
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
