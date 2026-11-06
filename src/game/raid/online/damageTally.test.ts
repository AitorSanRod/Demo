import { describe, expect, it, vi } from 'vitest'
import { RaidMemberKind } from '../raidRoom'
import { takeDamageTally } from './damageTally'
import { fillWithBots, player, seatPlayers, snap, tabRoom } from './online-test-utils'
import { seatPlayer, unseatPlayer, type SharedRoom } from './sharedRoom'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

/** Sala con dos jugadores, bots y daño hecho por todos */
function foughtRoom(): SharedRoom {
  const room = tabRoom()
  seatPlayers(room, 2)
  fillWithBots(room)
  room.raid.members.forEach((m, i) => (m.damage = (i + 1) * 10.4))
  return room
}

const playerDamage = (room: SharedRoom, playerIndex: number) => room.raid.members.filter((m) => m.kind === RaidMemberKind.Player)[playerIndex].damage

describe('daño de una sala para el ranking', () => {
  it('mientras el jefe sigue en pie no se apunta nada', () => {
    const room = foughtRoom()
    expect(takeDamageTally(room)).toEqual([])
    expect(room.damagePending).toBe(true)
  })

  it('al caer el jefe se apunta el daño de cada Pokémon de los jugadores (sin bots), una sola vez', () => {
    const room = foughtRoom()
    room.raid.hp = 0
    expect(takeDamageTally(room)).toEqual([
      { playerId: player(0), uid: 'mon0', speciesId: snap('mon0').speciesId, damage: Math.round(playerDamage(room, 0)) },
      { playerId: player(1), uid: 'mon1', speciesId: snap('mon1').speciesId, damage: Math.round(playerDamage(room, 1)) },
    ])
    expect(takeDamageTally(room)).toEqual([])
  })

  it('si el jefe se escapa también cuenta, y el de quien ya salió de la sala', () => {
    const room = foughtRoom()
    unseatPlayer(room, player(0))
    room.closed = true
    expect(takeDamageTally(room).map((d) => d.playerId)).toEqual([player(0), player(1)])
  })

  it('los Pokémon sin daño no se apuntan', () => {
    const room = tabRoom()
    seatPlayer(room, player(0), 'Ana', snap('a'))
    room.raid.hp = 0
    expect(takeDamageTally(room)).toEqual([])
  })

  it('las salas de antes del ranking no cuentan', () => {
    const room = foughtRoom()
    delete room.damagePending
    room.raid.hp = 0
    expect(takeDamageTally(room)).toEqual([])
  })
})
