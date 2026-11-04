import { describe, expect, it, vi } from 'vitest'
import { RAID_ROUND_MS } from '../raidCombat'
import { addBot } from '../raidBots'
import { presentMembers, RaidMemberKind } from '../raidRoom'
import { rng, seatPlayers, T0, tabRoom } from './online-test-utils'
import { catchUp } from './sharedRoom'
import { ROOM_PLAYED_ROUNDS, skipAhead } from './skipAhead'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

/** Sala con jugadores y un jefe que no cae en el tiempo del test */
function longFight() {
  const room = tabRoom()
  seatPlayers(room, 3)
  room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER
  return room
}

describe('resumen de una sala que lleva mucho sin consultas', () => {
  it('se pone al día con todas las rondas aunque solo juegue de verdad las últimas', () => {
    const room = longFight()
    const rounds = ROOM_PLAYED_ROUNDS * 20
    catchUp(room, T0 + rounds * RAID_ROUND_MS, rng)
    expect(room.raid.round).toBe(rounds)
    expect(room.raid.elapsedMs).toBe(rounds * RAID_ROUND_MS)
  })

  it('el jefe pierde vida y cada uno suma tiempo, daño y rondas de EXP', () => {
    const room = longFight()
    const before = room.raid.hp
    skipAhead(room, 100 * RAID_ROUND_MS)
    expect(room.raid.hp).toBeLessThan(before)
    for (const m of presentMembers(room.raid)) expect(m).toMatchObject({ presentMs: 100 * RAID_ROUND_MS, downMs: 0, hpFraction: 1 })
    expect(presentMembers(room.raid).some((m) => m.damage > 0)).toBe(true)
    expect(Object.values(room.seats).every((seat) => seat.expRounds > 0)).toBe(true)
  })

  it('si le da tiempo, el jefe cae y la sala no pasa de ahí', () => {
    const room = tabRoom()
    seatPlayers(room, 3)
    room.raid.hp = 1
    skipAhead(room, 1000 * RAID_ROUND_MS)
    expect(room.raid.hp).toBe(0)
    expect(room.raid.round).toBeLessThan(1000)
  })

  it('los bots que cumplen su tiempo se van', () => {
    const room = longFight()
    addBot(room.raid, rng)
    const bot = room.raid.members.find((m) => m.kind === RaidMemberKind.Bot)!
    skipAhead(room, bot.stayMs! + RAID_ROUND_MS)
    expect(bot.left).toBe(true)
  })
})
