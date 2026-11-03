import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { initialState, MonPlace, monPlace } from '../core/state'
import { seqRng } from '../core/test-utils'
import { runBlocker } from '../run/run'
import { createMon } from '../team/mons'
import { maxHp } from '../team/stats'
import { advanceRaid, ensureRaid, joinRaid, leaveRaid, raidBlocker, raidBossAt, raidBossHp, raidExpPerRound } from './raid'
import { RAID_BOTS_MIN } from './raidBots'
import { RAID_ROUND_MS } from './raidCombat'
import { newMember, RaidMemberKind } from './raidRoom'
import { raidState, sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

describe('jefe comunitario', () => {
  it('no aparece hasta acabar el tutorial', () => {
    const s = initialState()
    ensureRaid(s)
    expect(s.raid).toBeNull()
  })

  it('aparece el primero de la lista con su vida', () => {
    const { raid } = raidState()
    expect(raid.boss).toEqual(raidBossAt(0))
    expect(raid.hp).toBe(raidBossHp(raid.boss.level))
  })

  it('el Pokémon enviado está contra el jefe y no puede salir de ruta', () => {
    const { s, mon } = raidState()
    joinRaid(s, mon.uid)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Raid)
    expect(runBlocker(s)).toMatch(/jefe/)
  })

  it('solo admite un Pokémon del jugador a la vez', () => {
    const { s, mon } = raidState()
    const other = createMon(mon.speciesId, mon.level)
    s.owned.push(other)
    joinRaid(s, mon.uid)
    expect(raidBlocker(s, other.uid)).not.toBeNull()
  })

  it('un jefe que vive en una ruta bloqueada no admite a nadie hasta desbloquearla', () => {
    const { s, raid, mon } = raidState()
    raid.boss = { ...raid.boss, routeId: RouteId.Ruta1 }
    expect(raidBlocker(s, mon.uid)).toMatch(/desbloqu/)
    s.unlockedRoutes.push(RouteId.Ruta1)
    expect(raidBlocker(s, mon.uid)).toBeNull()
  })

  it('no se puede enviar a un Pokémon debilitado', () => {
    const { s, mon } = raidState()
    mon.hp = 0
    joinRaid(s, mon.uid)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })

  it('al retirarse vuelve al rancho con los PS que le quedaban', () => {
    const { s, raid, mon } = raidState()
    joinRaid(s, mon.uid)
    raid.members[0].hpFraction = 0.5
    leaveRaid(s, mon.uid)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
    expect(mon.hp).toBe(Math.round(maxHp(mon) * 0.5))
  })

  it('cada ronda llena la sala de bots y el Pokémon en pie gana EXP', () => {
    const { s, mon } = raidState()
    joinRaid(s, mon.uid)
    const before = { level: mon.level, exp: mon.exp }
    advanceRaid(s, RAID_ROUND_MS, seqRng(0.5))
    expect(s.raid!.round).toBe(1)
    expect(s.raid!.members.filter((m) => m.id !== mon.uid).length).toBeGreaterThanOrEqual(RAID_BOTS_MIN)
    expect(raidExpPerRound(s.raid!.boss)).toBeGreaterThan(0)
    expect(mon.level > before.level || mon.exp > before.exp).toBe(true)
  })

  it('el tiempo que no llega a una ronda se guarda para la siguiente', () => {
    const { s } = raidState()
    advanceRaid(s, RAID_ROUND_MS / 2)
    expect(s.raid!.round).toBe(0)
    advanceRaid(s, RAID_ROUND_MS / 2)
    expect(s.raid!.round).toBe(1)
  })

  it('al caer el jefe cobra quien estaba dentro, vuelve al rancho y sale el siguiente sin esperar', () => {
    const { s, raid, mon } = raidState()
    joinRaid(s, mon.uid)
    raid.hp = 1
    advanceRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(s.raidPrizes).toHaveLength(1)
    expect(s.raid!.felled).toBe(1)
    expect(s.raid!.boss).toEqual(raidBossAt(1))
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
    expect(s.raid!.members.some((m) => m.id === mon.uid)).toBe(false)
    expect(s.raid!.members.every((m) => m.presentMs === 0 && m.damage === 0)).toBe(true)
  })

  it('el premio de un jefe que vive en una ruta lleva esa ruta', () => {
    const { s, raid, mon } = raidState()
    s.unlockedRoutes.push(RouteId.Ruta1)
    raid.boss = { ...raid.boss, routeId: RouteId.Ruta1 }
    joinRaid(s, mon.uid)
    raid.hp = 1
    advanceRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(s.raidPrizes[0].routeId).toBe(RouteId.Ruta1)
  })

  it('quien se retiró antes de tiempo sin llegar al mínimo de presencia no cobra', () => {
    const { s, raid, mon } = raidState()
    joinRaid(s, mon.uid)
    leaveRaid(s, mon.uid)
    raid.elapsedMs = RAID_ROUND_MS * 1000
    raid.hp = 1
    // Un bot que seguro que le hace daño, para que caiga sin el Pokémon del jugador
    const bot = { id: 'bot-x', kind: RaidMemberKind.Bot, trainer: '', speciesId: sparringSpecies(raid.boss.speciesId), level: 1, stars: 0 }
    raid.members.push(newMember(bot, 1, RAID_ROUND_MS * 10))
    advanceRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(s.raid!.felled).toBe(1)
    expect(s.raidPrizes).toHaveLength(0)
  })
})
