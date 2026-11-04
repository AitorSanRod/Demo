import { describe, expect, it, vi } from 'vitest'
import { RAID_BOSSES } from '../../../data/raidBosses'
import { player, snap, stopChannel, TAB } from './online-test-utils'
import { DEFAULT_NICKNAME, NICKNAME_MAX, RaidAction, RoomSlot } from './protocol'
import { cleanNickname, parseRequest } from './requests'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const join = (overrides: Record<string, unknown> = {}) => ({
  action: RaidAction.Join,
  playerId: player(1),
  nickname: 'Ana',
  channel: TAB,
  mon: snap('a'),
  bossHp: null,
  ...overrides,
})

describe('peticiones al servidor de salas', () => {
  it('acepta una petición de entrar bien formada', () => {
    expect(parseRequest(join())).toEqual(join())
    expect(parseRequest(join({ channel: stopChannel(), bossHp: 0.5 }))).toMatchObject({ channel: stopChannel(), bossHp: 0.5 })
  })

  it('rechaza lo que no encaja', () => {
    expect(parseRequest(null)).toBeNull()
    expect(parseRequest(join({ playerId: 'corto' }))).toBeNull()
    expect(parseRequest(join({ action: 'borrar' }))).toBeNull()
    expect(parseRequest(join({ mon: snap('a', { speciesId: -1 }) }))).toBeNull()
    expect(parseRequest(join({ mon: snap('a', { hpFraction: 2 }) }))).toBeNull()
    expect(parseRequest(join({ mon: snap('a', { passives: [{ type: 'nada', level: 1 }] as never }) }))).toBeNull()
    expect(parseRequest(join({ channel: { slot: RoomSlot.Tab, bossIndex: RAID_BOSSES.length } }))).toBeNull()
    expect(parseRequest(join({ channel: { slot: RoomSlot.Route, routeId: 'no-existe', nodeId: 'x' } }))).toBeNull()
    expect(parseRequest(join({ bossHp: 0 }))).toBeNull()
  })

  it('ponerse al día admite retirarse (sin Pokémon) y solo ids de sala del almacén', () => {
    const sync = { action: RaidAction.Sync, playerId: player(1), nickname: 'Ana', roomId: 'tab/0/abc', mon: null }
    expect(parseRequest(sync)).toEqual(sync)
    expect(parseRequest({ ...sync, roomId: '../otra-cosa' })).toBeNull()
  })

  it('limpia el apodo: sin espacios de más, recortado y, vacío, el de por defecto', () => {
    expect(cleanNickname('  Ana   Pi  ')).toBe('Ana Pi')
    expect([...cleanNickname('x'.repeat(NICKNAME_MAX * 2))]).toHaveLength(NICKNAME_MAX)
    expect(cleanNickname('   ')).toBe(DEFAULT_NICKNAME)
    expect(cleanNickname(42)).toBe(DEFAULT_NICKNAME)
  })
})
