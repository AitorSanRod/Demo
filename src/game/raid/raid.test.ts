import { describe, expect, it, vi } from 'vitest'
import { initialState, MonPlace, monPlace } from '../core/state'
import { seqRng } from '../core/test-utils'
import { runBlocker } from '../run/run'
import { createMon } from '../team/mons'
import { maxHp } from '../team/stats'
import { advanceRaid, ensureRaid, joinRaid, leaveRaid, LOCAL_ROTATION, monRaidBlocker, RAID_COOLDOWN_MS, raidBlocker, raidRoomBlocker, raidBossAt, raidWaiting } from './raid'
import { RAID_BOTS } from './raidBots'
import { RAID_SOLO_MINUTES, raidBossHp, raidExpPerRound } from './raidEngine'
import { RAID_ROUND_MS } from './raidCombat'
import { inFinale, isEnding, RAID_ENDING_MS, RAID_FINALE_MS } from './raidEnding'
import { newMember, RaidMemberKind } from './raidRoom'
import { raidState, sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

describe('jefe comunitario', () => {
  it('no aparece hasta acabar el tutorial', () => {
    const s = initialState()
    ensureRaid(s)
    expect(s.raids[LOCAL_ROTATION]).toBeNull()
  })

  it('aparece el primero de la lista con su vida', () => {
    const { raid } = raidState()
    expect(raid.boss).toEqual(raidBossAt(0))
    expect(raid.hp).toBe(raidBossHp(raid.boss))
  })

  it('un jefe con sus propios minutos tiene la vida en proporción', () => {
    const level = raidBossAt(0).level
    const quick = raidBossHp({ level, soloMinutes: RAID_SOLO_MINUTES / 2 })
    expect(quick).toBeCloseTo(raidBossHp({ level }) / 2, -1)
    expect(raidBossHp({ level, soloMinutes: RAID_SOLO_MINUTES })).toBe(raidBossHp({ level }))
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
    expect(raidBlocker(s, other.uid, LOCAL_ROTATION)).not.toBeNull()
  })

  it('lo que impide entrar se separa en lo de la sala y lo de cada Pokémon (para elegir solo entre los que pueden)', () => {
    const { s, raid, mon } = raidState()
    const other = createMon(mon.speciesId, mon.level)
    s.owned.push(other)
    joinRaid(s, mon.uid)
    expect(raidRoomBlocker(s, LOCAL_ROTATION)).not.toBeNull()
    expect(monRaidBlocker(s, mon.uid, raid)).not.toBeNull()
    expect(monRaidBlocker(s, other.uid, raid)).toBeNull()
  })

  it('si el jefe tiene nivel mínimo, solo entran los que llegan a él', () => {
    const { s, raid, mon } = raidState()
    raid.boss = { ...raid.boss, minLevel: mon.level + 1 }
    expect(raidBlocker(s, mon.uid, LOCAL_ROTATION)).toMatch(/Nv\./)
    mon.level = raid.boss.minLevel!
    expect(raidBlocker(s, mon.uid, LOCAL_ROTATION)).toBeNull()
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
    expect(s.raids[LOCAL_ROTATION]!.round).toBe(1)
    expect(s.raids[LOCAL_ROTATION]!.members.filter((m) => m.id !== mon.uid).length).toBeGreaterThanOrEqual(RAID_BOTS.min)
    expect(raidExpPerRound(s.raids[LOCAL_ROTATION]!.boss)).toBeGreaterThan(0)
    expect(mon.level > before.level || mon.exp > before.exp).toBe(true)
  })

  it('el tiempo que no llega a una ronda se guarda para la siguiente', () => {
    const { s } = raidState()
    advanceRaid(s, RAID_ROUND_MS / 2)
    expect(s.raids[LOCAL_ROTATION]!.round).toBe(0)
    advanceRaid(s, RAID_ROUND_MS / 2)
    expect(s.raids[LOCAL_ROTATION]!.round).toBe(1)
  })

  it('al caer el jefe cobra quien estaba dentro, vuelve al rancho y la sala se vacía hasta el siguiente', () => {
    const { s, raid, mon } = raidState()
    joinRaid(s, mon.uid)
    raid.hp = 1
    advanceRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
    expect(s.raidPrizes).toHaveLength(1)
    expect(s.raids[LOCAL_ROTATION]!.felled).toBe(1)
    expect(s.raids[LOCAL_ROTATION]!.boss).toEqual(raidBossAt(1))
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
    expect(s.raids[LOCAL_ROTATION]!.members).toHaveLength(0)
    expect(s.raids[LOCAL_ROTATION]!.startsInMs).toBe(RAID_COOLDOWN_MS)
  })

  it('al caer el jefe la sala no se cierra: se ve su final (la última ronda y el cierre) y no se puede salir', () => {
    const { s, raid, mon } = raidState()
    joinRaid(s, mon.uid)
    raid.hp = 1
    advanceRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(s.raids[LOCAL_ROTATION]).toBe(raid)
    expect(isEnding(raid)).toBe(true)
    expect(raid.roundMsLeft).toBe(RAID_ROUND_MS)
    leaveRaid(s, mon.uid)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Raid)
    advanceRaid(s, RAID_ROUND_MS, seqRng(0))
    expect(inFinale(raid)).toBe(true)
    expect(s.raidPrizes).toHaveLength(0)
    advanceRaid(s, RAID_FINALE_MS, seqRng(0))
    expect(s.raids[LOCAL_ROTATION]).not.toBe(raid)
    expect(s.raidPrizes).toHaveLength(1)
  })

  it('el siguiente jefe aparece pasado RAID_COOLDOWN_MS: hasta entonces no hay rondas, ni bots, ni se puede entrar', () => {
    const { s, raid, mon } = raidState()
    raid.hp = 1
    joinRaid(s, mon.uid)
    advanceRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
    const next = s.raids[LOCAL_ROTATION]!
    advanceRaid(s, RAID_COOLDOWN_MS - 1, seqRng(0))
    expect(raidWaiting(next)).toBe(true)
    expect(next.round).toBe(0)
    expect(next.members).toHaveLength(0)
    expect(raidBlocker(s, mon.uid, LOCAL_ROTATION)).toMatch(/aún no/)
    advanceRaid(s, RAID_ROUND_MS + 1, seqRng(0))
    expect(raidWaiting(next)).toBe(false)
    expect(next.round).toBe(1)
    expect(next.members.length).toBeGreaterThanOrEqual(RAID_BOTS.min)
    // El siguiente jefe puede pedir más nivel que el primero
    mon.level = Math.max(mon.level, next.boss.minLevel ?? 0)
    expect(raidBlocker(s, mon.uid, LOCAL_ROTATION)).toBeNull()
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
    advanceRaid(s, RAID_ROUND_MS + RAID_ENDING_MS, seqRng(0))
    expect(s.raids[LOCAL_ROTATION]!.felled).toBe(1)
    expect(s.raidPrizes).toHaveLength(0)
  })
})
