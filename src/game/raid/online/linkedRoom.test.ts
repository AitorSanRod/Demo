import { describe, expect, it, vi } from 'vitest'
import { NodeKind, route, RouteId } from '../../../data/maps'
import { activeMon, initialState, MonPlace, monPlace, type GameState, type OwnedMon } from '../../core/state'
import { chooseStarter, seqRng } from '../../core/test-utils'
import { startRun, walk } from '../../run/run'
import { createMon } from '../../team/mons'
import { gainExp } from '../../team/stats'
import { advanceRaid, joinRaid, joinServerRaid, leaveRaid, raidBlocker } from '../raid'
import { sparringSpecies, raidState } from '../raid-test-utils'
import { RAID_ROUND_MS } from '../raidCombat'
import { raidExpPerRound } from '../raidEngine'
import { RaidMemberKind } from '../raidRoom'
import { isEnding, RAID_ENDING_MS } from '../raidEnding'
import { advanceRouteRaid, currentRouteRaid, retreatRouteRaid, ROUTE_RAID_RUNNING_CHANCE } from '../routeRaid'
import { applyView, forgetRoom, roomRequest, type RoomKey } from './linkedRoom'
import { newId, rng, T0 } from './online-test-utils'
import { channelKey, RaidAction, RaidRotation, RoomSlot, type JoinRequest, type RoomView } from './protocol'
import { cycleChannel, firstCycle } from './raidCycle'
import { joinStopRoom, syncRoom } from './roomServer'
import { catchUp, viewFor, type SharedRoom } from './sharedRoom'
import { joinTabRoom, updateCycle } from './tabRooms'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const ME = 'player-me-0001'

/** Hace de servidor en una parada: atiende la petición de entrar y aplica la respuesta */
function joinStopOnServer(s: GameState): SharedRoom {
  const req = roomRequest(s, RoomSlot.Route) as JoinRequest
  const room = joinStopRoom([], { ...req, playerId: ME, nickname: 'Yo' } as never, T0, rng, newId)
  applyView(s, RoomSlot.Route, null, viewFor(room, ME))
  return room
}

/** Hace de servidor: juega la sala `ms` más y devuelve lo que vería el jugador al consultar */
function serverView(s: GameState, key: RoomKey, room: SharedRoom, ms = 0): RoomView {
  catchUp(room, room.updatedAt + ms, rng)
  const req = roomRequest(s, key)!
  return syncRoom(room, { ...req, action: RaidAction.Sync, roomId: room.id, playerId: ME, nickname: 'Yo' } as never, room.updatedAt, rng)
}

/** El primer ciclo de una rotación en el servidor, con su sala principal (con ids como los del servidor) */
function serverFront(rotation: RaidRotation) {
  const cycle = firstCycle(rotation)
  const roomId = () => `${channelKey(cycleChannel(cycle))}/${newId()}`
  return { cycle, roomId, rooms: updateCycle(cycle, [], [], T0, rng, roomId).rooms }
}

/** Hace de servidor en la pestaña Raids: el jugador ve la sala principal de la rotación, manda a ese Pokémon y se sienta allí */
function linkInto(s: GameState, mon: OwnedMon, rotation: RaidRotation): SharedRoom {
  const { cycle, roomId, rooms } = serverFront(rotation)
  const front = viewFor(rooms[0], ME)
  mon.level = Math.max(mon.level, front.raid.boss.minLevel ?? 0)
  joinServerRaid(s, mon.uid, front.raid, front.roomId)
  const req = roomRequest(s, rotation) as JoinRequest
  const { room } = joinTabRoom(cycle, rooms, { ...req, playerId: ME, nickname: 'Yo' }, T0, rng, roomId)
  applyView(s, rotation, null, viewFor(room!, ME))
  return room!
}

/** Con servidor: el Pokémon del jugador luchando en la sala principal de la rotación ordenada */
function linkedTab() {
  const { s, mon } = raidState()
  s.raidServer = true
  s.raids[RaidRotation.Ordered] = null
  return { s, mon, room: linkInto(s, mon, RaidRotation.Ordered) }
}

function linkedStop() {
  const s = initialState()
  const stop = route(RouteId.BosqueVerde).nodes.find((n) => n.kind === NodeKind.Raid)!
  chooseStarter(s, sparringSpecies(stop.boss!.speciesId))
  s.unlockedRoutes.push(RouteId.BosqueVerde)
  startRun(s, RouteId.BosqueVerde)
  walk(s, Number.MAX_SAFE_INTEGER, seqRng(ROUTE_RAID_RUNNING_CHANCE + (1 - ROUTE_RAID_RUNNING_CHANCE) / 2))
  const room = joinStopOnServer(s)
  return { s, mon: activeMon(s)!, room }
}

describe('sala enlazada al servidor', () => {
  it('al mandar a un Pokémon la sala espera sitio y se pide entrar con él', () => {
    const { s, mon } = raidState()
    joinRaid(s, mon.uid)
    expect(s.raids[RaidRotation.Ordered]!.remote).toMatchObject({ roomId: null })
    expect(roomRequest(s, RaidRotation.Ordered)).toMatchObject({ action: RaidAction.Join, channel: { slot: RoomSlot.Tab, rotation: RaidRotation.Ordered }, mon: { uid: mon.uid } })
  })

  it('si se retira antes de entrar, ya no se pide nada', () => {
    const { s, mon } = raidState()
    joinRaid(s, mon.uid)
    leaveRaid(s, mon.uid)
    expect(roomRequest(s, RaidRotation.Ordered)).toBeNull()
  })

  it('con la respuesta, la sala local es el reflejo de la del servidor y ya no se juega aquí', () => {
    const { s, mon, room } = linkedTab()
    expect(s.raids[RaidRotation.Ordered]!.remote!.roomId).toBe(room.id)
    expect(s.raids[RaidRotation.Ordered]!.members.find((m) => m.id === mon.uid)!.kind).toBe(RaidMemberKind.Player)
    const round = s.raids[RaidRotation.Ordered]!.round
    advanceRaid(s, 5 * RAID_ROUND_MS)
    expect(s.raids[RaidRotation.Ordered]!.round).toBe(round)
    expect(roomRequest(s, RaidRotation.Ordered)).toMatchObject({ action: RaidAction.Sync, roomId: room.id, mon: { uid: mon.uid } })
  })

  it('se puede luchar a la vez contra el jefe de cada rotación, con un Pokémon en cada una', () => {
    const { s, mon, room } = linkedTab()
    const other = createMon(mon.speciesId, mon.level)
    s.owned.push(other)
    const second = linkInto(s, other, RaidRotation.Random)
    expect(monPlace(s, other.uid)).toBe(MonPlace.Raid)
    expect(roomRequest(s, RaidRotation.Ordered)).toMatchObject({ action: RaidAction.Sync, roomId: room.id, mon: { uid: mon.uid } })
    expect(roomRequest(s, RaidRotation.Random)).toMatchObject({ action: RaidAction.Sync, roomId: second.id, mon: { uid: other.uid } })
    leaveRaid(s, other.uid)
    expect(monPlace(s, other.uid)).toBe(MonPlace.Ranch)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Raid)
  })

  it('el mismo Pokémon no puede estar en las dos rotaciones', () => {
    const { s, mon } = linkedTab()
    const { rooms } = serverFront(RaidRotation.Random)
    expect(raidBlocker(s, mon.uid, RaidRotation.Random, viewFor(rooms[0], ME).raid)).not.toBeNull()
  })

  it('el Pokémon gana la EXP de las rondas que el servidor le ha contado desde la última vez', () => {
    const { s, mon, room } = linkedTab()
    const expected = structuredClone(mon)
    room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER
    const view = serverView(s, RaidRotation.Ordered, room, 5 * RAID_ROUND_MS)
    gainExp(expected, (view.exp[mon.uid] - s.raids[RaidRotation.Ordered]!.remote!.exp[mon.uid]) * raidExpPerRound(room.raid.boss))
    applyView(s, RaidRotation.Ordered, room.id, view)
    expect({ level: mon.level, exp: mon.exp }).toEqual({ level: expected.level, exp: expected.exp })
  })

  it('si el jefe cae en el servidor, el premio queda pendiente y el siguiente jefe lo pone el servidor', () => {
    const { s, room } = linkedTab()
    room.raid.hp = 0
    applyView(s, RaidRotation.Ordered, room.id, serverView(s, RaidRotation.Ordered, room))
    expect(isEnding(s.raids[RaidRotation.Ordered]!)).toBe(true)
    expect(roomRequest(s, RaidRotation.Ordered)).toBeNull()
    expect(applyView(s, RaidRotation.Ordered, room.id, serverView(s, RaidRotation.Ordered, room))).toBe(false)
    expect(s.raidPrizes).toHaveLength(0)
    advanceRaid(s, RAID_ENDING_MS)
    expect(s.raidPrizes).toHaveLength(1)
    expect(s.raids[RaidRotation.Ordered]).toBeNull()
    advanceRaid(s, 5 * RAID_ROUND_MS)
    expect(s.raids[RaidRotation.Ordered]).toBeNull()
  })

  it('si el jefe se escapa (el ciclo pasó al siguiente), el Pokémon vuelve al rancho sin premio', () => {
    const { s, room, mon } = linkedTab()
    room.closed = true
    applyView(s, RaidRotation.Ordered, room.id, serverView(s, RaidRotation.Ordered, room))
    expect(s.raidPrizes).toHaveLength(0)
    expect(s.raids[RaidRotation.Ordered]).toBeNull()
    expect(roomRequest(s, RaidRotation.Ordered)).toBeNull()
    expect(mon.hp).toBeGreaterThan(0)
  })

  it('si el servidor ya no tiene la sala de la pestaña Raids, se deja (el frontal es del servidor)', () => {
    const { s, room } = linkedTab()
    expect(applyView(s, RaidRotation.Ordered, room.id, null)).toBe(true)
    expect(s.raids[RaidRotation.Ordered]).toBeNull()
  })

  it('con servidor y sin un Pokémon propio dentro, aquí no se juega ninguna sala de la pestaña Raids', () => {
    const { s } = raidState()
    s.raidServer = true
    advanceRaid(s, 5 * RAID_ROUND_MS)
    expect(s.raids[RaidRotation.Ordered]).toBeNull()
  })

  it('una respuesta de otra sala se descarta', () => {
    const { s, room } = linkedTab()
    expect(applyView(s, RaidRotation.Ordered, 'tab/0/otra', serverView(s, RaidRotation.Ordered, room))).toBe(false)
  })

  it('en una parada, al caer el jefe en el servidor la ruta sigue con su premio', () => {
    const { s, room } = linkedStop()
    room.raid.hp = 0
    applyView(s, RoomSlot.Route, room.id, serverView(s, RoomSlot.Route, room))
    expect(s.run!.phase).toBe('raid')
    advanceRouteRaid(s, RAID_ENDING_MS)
    expect(s.run!.phase).not.toBe('raid')
    expect(s.run!.earned.raidBosses).toEqual([room.raid.boss.speciesId])
  })

  it('en una parada, si gasta sus vidas en el servidor vuelve al principio de la ruta', () => {
    const { s, room } = linkedStop()
    const view = serverView(s, RoomSlot.Route, room)
    Object.assign(view.raid.members.find((m) => m.kind === RaidMemberKind.Player)!, { lives: 0, left: true })
    applyView(s, RoomSlot.Route, room.id, view)
    advanceRouteRaid(s, RAID_ENDING_MS)
    expect(s.run).toMatchObject({ stop: 0, phase: 'walking' })
    expect(s.run!.raidRejoinHp).not.toBeNull()
  })

  it('al retirarse de una parada enlazada, queda avisar al servidor', () => {
    const { s, room } = linkedStop()
    retreatRouteRaid(s)
    expect(currentRouteRaid(s)).toBeNull()
    expect(s.roomsToLeave).toEqual([room.id])
    forgetRoom(s, room.id)
    expect(s.roomsToLeave).toEqual([])
  })
})
