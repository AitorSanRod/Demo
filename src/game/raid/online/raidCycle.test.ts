import { describe, expect, it, vi } from 'vitest'
import { RAID_BOSSES } from '../../../data/raidBosses'
import { newId, player, rng, seatPlayers, snap, T0 } from './online-test-utils'
import { seqRng } from '../../core/test-utils'
import { CyclePhase, RAID_ROTATIONS, RaidAction, RaidRotation, RoomSlot } from './protocol'
import { newBossPush } from './raidPushes'
import {
  CYCLE_COOLDOWN_MS,
  CYCLE_MAX_EXTRA_MS,
  cycleBoss,
  cycleBosses,
  cycleBossIndex,
  cycleChannel,
  cyclePhase,
  featuredRoom,
  firstCycle,
  followingBoss,
  nextBossAt,
  nextCycleBossIndex,
  type RaidCycle,
} from './raidCycle'
import { createTabRoom, playersIn, unseatPlayer, type SharedRoom } from './sharedRoom'
import { joinTabRoom, updateCycle } from './tabRooms'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const join = (n: number, targetRoomId: string | null = null) => ({
  action: RaidAction.Join,
  playerId: player(n),
  nickname: `J${n}`,
  channel: { slot: RoomSlot.Tab },
  targetRoomId,
  mon: snap(`mon${n}`),
  bossHp: null,
})

/** Ciclo recién empezado, con su sala principal */
function openCycle() {
  const cycle = firstCycle(RaidRotation.Ordered)
  const { rooms } = updateCycle(cycle, [], [], T0, rng, newId)
  return { cycle, rooms, main: rooms[0] }
}

/** Otra sala del ciclo, con un jugador (desde `from`) */
function extraRoom(cycle: RaidCycle, rooms: SharedRoom[], from: number) {
  const room = createTabRoom(cycleChannel(cycle), cycleBoss(cycle), newId(), T0)
  seatPlayers(room, 1, from)
  rooms.push(room)
  return room
}

/** El jefe de la sala no cae solo durante el test */
const endless = (room: SharedRoom) => (room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER)

/** Cae el jefe de la sala y el servidor lo ve al ponerse al día en `now` */
function fall(cycle: RaidCycle, rooms: SharedRoom[], room: SharedRoom, now: number) {
  room.raid.hp = 0
  return updateCycle(cycle, rooms, [], now, rng, newId)
}

describe('ciclo del jefe de la pestaña Raids', () => {
  it('al empezar hay una sala principal con el primer jefe y es la del frontal mientras no juega nadie', () => {
    const { cycle, rooms, main } = openCycle()
    expect(main.raid.boss).toEqual(RAID_BOSSES[cycleBossIndex(cycle)])
    expect(cycle.mainRoomId).toBe(main.id)
    expect(cyclePhase(cycle)).toBe(CyclePhase.Active)
    expect(featuredRoom(cycle, rooms, null)).toBe(main)
  })

  it('en el frontal sale la sala con más jugadores, o la que el jugador ha elegido mirar', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 10)
    const other = extraRoom(cycle, rooms, 20)
    seatPlayers(other, 3, 30)
    expect(featuredRoom(cycle, rooms, null)).toBe(main)
    expect(featuredRoom(cycle, rooms, other.id)).toBe(other)
  })

  it('cuando cae el primer jefe empieza la espera y ya no se abren salas', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 10)
    const other = extraRoom(cycle, rooms, 20)
    fall(cycle, rooms, other, T0 + 1000)
    expect(cyclePhase(cycle)).toBe(CyclePhase.Closing)
    expect(nextBossAt(cycle)).toBe(T0 + 1000 + CYCLE_COOLDOWN_MS)
    // La principal está llena de jugadores: antes se abría otra; ahora no hay jefe al que entrar
    expect(joinTabRoom(cycle, rooms, join(99), T0 + 2000, rng, newId).room).toBeNull()
  })

  it('cerrándose, se puede entrar en una sala que aún pelea con jugadores, pero no en una solo de bots', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 1)
    const botsOnly = extraRoom(cycle, rooms, 20)
    unseatPlayer(botsOnly, player(20))
    const fallen = extraRoom(cycle, rooms, 40)
    fall(cycle, rooms, fallen, T0 + 1000)
    expect(joinTabRoom(cycle, rooms, join(99, botsOnly.id), T0 + 2000, rng, newId).room).toBe(main)
  })

  it('el siguiente jefe espera a que pase la espera y a que acaben las salas con jugadores', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 2)
    endless(main)
    const first = extraRoom(cycle, rooms, 20)
    const fellAt = T0 + 1000
    fall(cycle, rooms, first, fellAt)
    expect(updateCycle(cycle, rooms, [], fellAt + CYCLE_COOLDOWN_MS, rng, newId).cycleChanged).toBe(false)
    expect(cycle.number).toBe(0)
    // La principal acaba después de la espera: el siguiente empieza en ese momento
    const next = fall(cycle, rooms, main, fellAt + CYCLE_COOLDOWN_MS + 5000)
    expect(cycle.number).toBe(1)
    expect(cyclePhase(cycle)).toBe(CyclePhase.Active)
    expect(next.rooms).toHaveLength(1)
    expect(next.rooms[0].channel).toEqual({ slot: RoomSlot.Tab, rotation: RaidRotation.Ordered, cycle: 1 })
  })

  it('si los jugadores se van de una sala pendiente, ya no retiene al siguiente', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 1)
    endless(main)
    const first = extraRoom(cycle, rooms, 20)
    fall(cycle, rooms, first, T0)
    unseatPlayer(main, player(0))
    expect(playersIn(main)).toBe(0)
    updateCycle(cycle, rooms, [], T0 + CYCLE_COOLDOWN_MS, rng, newId)
    expect(cycle.number).toBe(1)
  })

  it('pasado el tope, el jefe se escapa de las salas que aún pelean y empieza el siguiente', () => {
    const { cycle, rooms, main } = openCycle()
    seatPlayers(main, 1)
    const first = extraRoom(cycle, rooms, 20)
    fall(cycle, rooms, first, T0)
    main.raid.hp = main.raid.maxHp = Number.MAX_SAFE_INTEGER
    const update = updateCycle(cycle, rooms, [], T0 + CYCLE_COOLDOWN_MS + CYCLE_MAX_EXTRA_MS, rng, newId)
    expect(main.closed).toBe(true)
    expect(update.touched).toContain(main)
    expect(cycle.number).toBe(1)
  })
})

describe('rotaciones de jefes', () => {
  const all = RAID_BOSSES.map((_, i) => i)

  it('la ordenada sigue la lista y al acabarla vuelve al primero', () => {
    const cycle = firstCycle(RaidRotation.Ordered)
    expect(cycleBossIndex(cycle)).toBe(0)
    expect(followingBoss(RaidRotation.Ordered, 0, [], rng)).toBe(1 % RAID_BOSSES.length)
    expect(followingBoss(RaidRotation.Ordered, RAID_BOSSES.length - 1, [], rng)).toBe(0)
  })

  it('la de azar no repite su jefe ni coge los de la otra rotación mientras quede alguno', () => {
    for (const roll of [0, 0.5, 0.99]) {
      const next = followingBoss(RaidRotation.Random, 0, [1], seqRng(roll))
      expect(next).not.toBe(0)
      if (RAID_BOSSES.length > 2) expect(next).not.toBe(1)
      // Si la otra rotación los tiene todos, al menos no repite el suyo
      expect(followingBoss(RaidRotation.Random, 0, all, seqRng(roll))).not.toBe(0)
    }
  })

  it('la de azar empieza con un jefe distinto de los de la otra', () => {
    const ordered = firstCycle(RaidRotation.Ordered)
    const random = firstCycle(RaidRotation.Random, cycleBosses(ordered), seqRng(0))
    if (RAID_BOSSES.length > 2) expect(cycleBosses(ordered)).not.toContain(cycleBossIndex(random))
  })

  it('al pasar de ciclo sale el jefe que se anunciaba como siguiente, con sus salas en la carpeta de la rotación', () => {
    const cycle = firstCycle(RaidRotation.Random, [], seqRng(0))
    const announced = nextCycleBossIndex(cycle)
    const { rooms } = updateCycle(cycle, [], [], T0, rng, newId)
    fall(cycle, rooms, rooms[0], T0)
    const next = updateCycle(cycle, rooms, [], T0 + CYCLE_COOLDOWN_MS, rng, newId)
    expect(cycle.number).toBe(1)
    expect(cycleBossIndex(cycle)).toBe(announced)
    expect(nextCycleBossIndex(cycle)).not.toBe(announced)
    expect(next.rooms[0].raid.boss).toEqual(RAID_BOSSES[announced])
    expect(next.rooms[0].channel).toEqual({ slot: RoomSlot.Tab, rotation: RaidRotation.Random, cycle: 1 })
  })

  it('cada rotación avisa de su jefe nuevo con su propia clave', () => {
    const keys = RAID_ROTATIONS.map((r) => newBossPush(firstCycle(r), T0).job.key)
    expect(new Set(keys).size).toBe(RAID_ROTATIONS.length)
  })
})
