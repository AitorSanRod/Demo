import { describe, expect, it, vi } from 'vitest'
import { newId, player, rng, seatPlayers, snap, T0 } from './online-test-utils'
import { channelKey, RaidAction, RaidRotation, roomRotation, RoomSlot, type JoinRequest } from './protocol'
import { cycleChannel, firstCycle } from './raidCycle'
import { joinRotation, updateCycle } from './tabRooms'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const join = (n: number, targetRoomId: string | null = null): JoinRequest => ({
  action: RaidAction.Join,
  playerId: player(n),
  nickname: `J${n}`,
  channel: { slot: RoomSlot.Tab },
  targetRoomId,
  mon: snap(`mon${n}`),
  bossHp: null,
})

/** Las dos rotaciones recién empezadas, cada una con su sala principal (con ids como los del servidor) */
function boards() {
  return [RaidRotation.Ordered, RaidRotation.Random].map((rotation) => {
    const cycle = firstCycle(rotation)
    const roomId = () => `${channelKey(cycleChannel(cycle))}/${newId()}`
    return { cycle, rooms: updateCycle(cycle, [], [], T0, rng, roomId).rooms }
  })
}

describe('entrar en una rotación de la pestaña Raids', () => {
  it('el id de cada sala dice su rotación', () => {
    for (const { cycle, rooms } of boards()) expect(roomRotation(rooms[0].id)).toBe(cycle.rotation)
  })

  it('con una sala elegida, se entra en su rotación', () => {
    const [, random] = boards()
    expect(joinRotation(boards(), join(1, random.rooms[0].id))).toBe(RaidRotation.Random)
  })

  it('sin elegir, se vuelve a la rotación en la que ya estuvo; si no estuvo en ninguna, la ordenada', () => {
    const all = boards()
    seatPlayers(all[1].rooms[0], 1, 7)
    expect(joinRotation(all, join(7))).toBe(RaidRotation.Random)
    expect(joinRotation(all, join(8))).toBe(RaidRotation.Ordered)
  })

  it('sin elegir sala, la rotación que pide el jugador manda sobre la de la sala en la que ya estuvo', () => {
    const all = boards()
    seatPlayers(all[1].rooms[0], 1, 7)
    const ordered = { ...join(7), channel: { slot: RoomSlot.Tab, rotation: RaidRotation.Ordered } } as const
    expect(joinRotation(all, ordered)).toBe(RaidRotation.Ordered)
  })
})
