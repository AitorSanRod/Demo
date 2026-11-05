import { describe, expect, it, vi } from 'vitest'
import { presentMembers, RAID_ROOM_SIZE, RaidMemberKind } from '../raidRoom'
import { ROUTE_RAID_JOIN_MIN_HP } from '../stopRoom'
import { fillWithBots, newId, player, rng, seatPlayers, snap, stopChannel, T0, tabRoom } from './online-test-utils'
import { RaidAction, type JoinRequest } from './protocol'
import { isExpired, isSettled, joinStopRoom, pickRoom, ROOM_TTL_MS, syncRoom } from './roomServer'
import { createRoom, playersIn, seatPlayer, unseatPlayer } from './sharedRoom'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

/** Petición de entrar en la parada de pruebas */
const joinReq = (n: number) => ({
  action: RaidAction.Join,
  playerId: player(n),
  nickname: `J${n}`,
  channel: stopChannel(),
  targetRoomId: null,
  mon: snap(`mon${n}`),
  bossHp: null,
}) satisfies JoinRequest

describe('elegir sala', () => {
  it('prefiere la sala con más jugadores', () => {
    const few = tabRoom()
    seatPlayers(few, 1)
    const many = tabRoom()
    seatPlayers(many, 3, 10)
    expect(pickRoom([few, many], player(99))).toBe(many)
  })

  it('vuelve a la sala en la que ya estuvo el jugador, aunque otra tenga más gente', () => {
    const mine = tabRoom()
    seatPlayer(mine, player(1), 'Ana', snap('a'))
    unseatPlayer(mine, player(1))
    const crowded = tabRoom()
    seatPlayers(crowded, 4, 10)
    expect(pickRoom([crowded, mine], player(1))).toBe(mine)
  })

  it('no ofrece salas solo de bots, con el jefe caído ni llenas de jugadores', () => {
    const bots = tabRoom()
    fillWithBots(bots)
    const fallen = tabRoom()
    seatPlayers(fallen, 1)
    fallen.raid.hp = 0
    const full = tabRoom()
    seatPlayers(full, RAID_ROOM_SIZE, 20)
    expect(pickRoom([bots, fallen, full], player(99))).toBeNull()
  })

  it('en una parada, no ofrece salas con el jefe por debajo del mínimo', () => {
    const room = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayers(room, 1)
    room.raid.hp = Math.floor(room.raid.maxHp * ROUTE_RAID_JOIN_MIN_HP)
    expect(pickRoom([room], player(99))).toBeNull()
  })
})

describe('entrar en una parada y ponerse al día', () => {
  it('sin sala que valga, abre una nueva y sienta al jugador', () => {
    const room = joinStopRoom([], joinReq(1), T0, rng, newId)
    expect(playersIn(room)).toBe(1)
    expect(room.channel).toEqual(stopChannel())
  })

  it('entra en la sala de otro jugador aunque esté llena de bots: sale un bot', () => {
    const room = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayers(room, 1)
    fillWithBots(room)
    expect(joinStopRoom([room], joinReq(2), T0, rng, newId)).toBe(room)
    expect(playersIn(room)).toBe(2)
    expect(presentMembers(room.raid).filter((m) => m.kind === RaidMemberKind.Bot)).toHaveLength(RAID_ROOM_SIZE - 2)
  })

  it('en una parada, la sala nueva puede abrirse ya en marcha con la vida pedida', () => {
    const room = joinStopRoom([], { ...joinReq(1), bossHp: 0.5 }, T0, rng, newId)
    expect(room.raid.hp).toBeLessThan(room.raid.maxHp)
  })

  it('al ponerse al día el jugador queda dentro o fuera según lo que pida', () => {
    const room = joinStopRoom([], joinReq(1), T0, rng, newId)
    const sync = { action: RaidAction.Sync, playerId: player(1), nickname: 'J1', roomId: room.id } as const
    expect(syncRoom(room, { ...sync, mon: null }, T0, rng).raid.members.every((m) => m.left || m.kind !== RaidMemberKind.Player)).toBe(true)
    expect(playersIn(room)).toBe(0)
    syncRoom(room, { ...sync, mon: snap('mon1') }, T0, rng)
    expect(playersIn(room)).toBe(1)
  })

  it('en una parada terminada, quien la consulta ve cómo acabó y sale; sin nadie dentro, queda para borrar', () => {
    const room = joinStopRoom([], joinReq(1), T0, rng, newId)
    joinStopRoom([room], joinReq(2), T0, rng, newId)
    room.raid.hp = 0
    const sync = (n: number) => ({ action: RaidAction.Sync, playerId: player(n), nickname: `J${n}`, roomId: room.id, mon: snap(`mon${n}`) }) as const
    const view = syncRoom(room, sync(1), T0, rng)
    expect(view.raid.members.some((m) => m.kind === RaidMemberKind.Player && !m.left)).toBe(true)
    expect(playersIn(room)).toBe(1)
    expect(isSettled(room)).toBe(false)
    syncRoom(room, sync(2), T0, rng)
    expect(isSettled(room)).toBe(true)
  })

  it('una sala de la pestaña Raids nunca queda para borrar por sí sola', () => {
    const room = tabRoom()
    room.raid.hp = 0
    expect(isSettled(room)).toBe(false)
  })

  it('una sala caduca si nadie la consulta en ROOM_TTL_MS', () => {
    const room = tabRoom()
    expect(isExpired(room, T0 + ROOM_TTL_MS)).toBe(false)
    expect(isExpired(room, T0 + ROOM_TTL_MS + 1)).toBe(true)
  })
})
