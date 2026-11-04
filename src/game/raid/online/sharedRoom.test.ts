import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../../core/test-utils'
import { RAID_ROUND_MS } from '../raidCombat'
import { PLAYER_TRAINER } from '../raidEngine'
import { BOSS_ID, presentMembers, RAID_ROOM_SIZE, RaidMemberKind } from '../raidRoom'
import { ROUTE_RAID_LIVES } from '../routeRaid'
import { fillWithBots, player, rng, seatPlayers, snap, stopChannel, T0, tabRoom } from './online-test-utils'
import { catchUp, createRoom, playersIn, ROOM_MAX_CATCHUP_MS, seatPlayer, unseatPlayer, viewFor } from './sharedRoom'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const present = (room: ReturnType<typeof tabRoom>) => presentMembers(room.raid)

describe('sala compartida', () => {
  it('un jugador se sienta con su Pokémon; en la pestaña sin límite de vidas, en una parada con las de la ruta', () => {
    const tab = tabRoom()
    expect(seatPlayer(tab, player(1), 'Ana', snap('a'))).toBe(true)
    expect(present(tab)).toMatchObject([{ kind: RaidMemberKind.Player, trainer: 'Ana', lives: null }])

    const stop = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayer(stop, player(1), 'Ana', snap('a'))
    expect(present(stop)[0].lives).toBe(ROUTE_RAID_LIVES)
  })

  it('si la sala está llena de bots, echa a uno para que entre el jugador', () => {
    const room = tabRoom()
    fillWithBots(room)
    expect(seatPlayer(room, player(1), 'Ana', snap('a'))).toBe(true)
    expect(present(room)).toHaveLength(RAID_ROOM_SIZE)
    expect(playersIn(room)).toBe(1)
    expect(room.raid.members.filter((m) => m.kind === RaidMemberKind.Bot && m.left)).toHaveLength(1)
  })

  it('si está llena de jugadores no cabe nadie más', () => {
    const room = tabRoom()
    seatPlayers(room, RAID_ROOM_SIZE)
    expect(seatPlayer(room, player(99), 'Otro', snap('z'))).toBe(false)
    expect(playersIn(room)).toBe(RAID_ROOM_SIZE)
  })

  it('al volver con el mismo Pokémon conserva su daño; con otro, el anterior sale', () => {
    const room = tabRoom()
    seatPlayer(room, player(1), 'Ana', snap('a'))
    present(room)[0].damage = 50
    unseatPlayer(room, player(1))
    seatPlayer(room, player(1), 'Ana', snap('a'))
    expect(present(room)).toMatchObject([{ damage: 50 }])

    seatPlayer(room, player(1), 'Ana', snap('b'))
    expect(present(room)).toHaveLength(1)
    expect(present(room)[0].damage).toBe(0)
  })

  it('se pone al día con el tiempo real: rondas jugadas y EXP contada a quien empieza la ronda en pie', () => {
    const room = tabRoom()
    seatPlayer(room, player(1), 'Ana', snap('a'))
    catchUp(room, T0 + 3 * RAID_ROUND_MS, rng)
    expect(room.raid.round).toBe(3)
    expect(room.updatedAt).toBe(T0 + 3 * RAID_ROUND_MS)
    expect(Object.values(room.seats)[0].expRounds).toBeGreaterThan(0)
  })

  it('nunca se pone al día más de ROOM_MAX_CATCHUP_MS de golpe', () => {
    const room = tabRoom()
    room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER
    catchUp(room, T0 + 2 * ROOM_MAX_CATCHUP_MS, rng)
    expect(room.raid.round).toBe(Math.floor(ROOM_MAX_CATCHUP_MS / RAID_ROUND_MS))
  })

  it('quien gasta sus vidas sale y la pelea sigue sin él', () => {
    const room = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayers(room, 2)
    Object.assign(present(room)[0], { lives: 1, hpFraction: Number.MIN_VALUE })
    room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER
    // Con 0 el jefe pega al primero que está en pie
    catchUp(room, T0 + 10 * RAID_ROUND_MS, seqRng(0))
    expect(room.raid.members[0]).toMatchObject({ left: true, lives: 0 })
    expect(room.raid.round).toBe(10)
  })

  it('cada jugador ve sus Pokémon con su uid y como suyos, y los de los demás como invitados', () => {
    const room = tabRoom()
    seatPlayers(room, 2)
    catchUp(room, T0 + RAID_ROUND_MS, rng)
    const view = viewFor(room, player(0))
    const mine = view.raid.members.find((m) => m.id === 'mon0')!
    expect(mine).toMatchObject({ kind: RaidMemberKind.Player, trainer: PLAYER_TRAINER })
    expect(view.raid.members.filter((m) => m.kind === RaidMemberKind.Guest)).toHaveLength(1)
    const ids = new Set([...view.raid.members.map((m) => m.id), BOSS_ID])
    expect(view.raid.lastRound.every((h) => ids.has(h.from) && ids.has(h.to))).toBe(true)
    expect(Object.keys(view.exp)).toEqual(['mon0'])
  })
})
