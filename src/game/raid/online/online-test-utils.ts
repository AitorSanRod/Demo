import { NodeKind, route, RouteId } from '../../../data/maps'
import { seqRng } from '../../core/test-utils'
import { raidBossAt } from '../raid'
import { sparringSpecies } from '../raid-test-utils'
import { addBot } from '../raidBots'
import { presentMembers, RAID_ROOM_SIZE } from '../raidRoom'
import { RoomSlot, type MonSnapshot, type RoomChannel } from './protocol'
import { createRoom, seatPlayer, type SharedRoom } from './sharedRoom'

// Piezas comunes de los tests de salas compartidas (con el mapa de pruebas: vi.mock de kantoMaps en cada test)

export const T0 = 1_000_000
export const rng = seqRng(0.5)

export const TAB: RoomChannel = { slot: RoomSlot.Tab, cycle: 0 }

/** La parada de jefe comunitario de la ruta de pruebas */
export function stopChannel(): Extract<RoomChannel, { slot: typeof RoomSlot.Route }> {
  const r = route(RouteId.BosqueVerde)
  return { slot: RoomSlot.Route, routeId: r.id, nodeId: r.nodes.find((n) => n.kind === NodeKind.Raid)!.id }
}

/** Id de jugador válido para el servidor */
export const player = (n: number) => `player-${String(n).padStart(4, '0')}`

/** Un Pokémon que puede herir al jefe de la pestaña y que el jefe puede herir, de su nivel */
export function snap(uid: string, overrides: Partial<MonSnapshot> = {}): MonSnapshot {
  const boss = raidBossAt(0)
  return { uid, speciesId: sparringSpecies(boss.speciesId), level: boss.level, stars: 0, hpFraction: 1, passives: [], ...overrides }
}

let nextId = 0
export const newId = () => `test/${nextId++}`

export const tabRoom = (now = T0) => createRoom(TAB, newId(), now, null, rng)

/** Rellena con bots hasta que no quepa nadie más */
export function fillWithBots(room: SharedRoom) {
  while (presentMembers(room.raid).length < RAID_ROOM_SIZE) addBot(room.raid, rng)
}

/** Sienta a `count` jugadores distintos (desde `from`), cada uno con un Pokémon */
export function seatPlayers(room: SharedRoom, count: number, from = 0) {
  for (let i = from; i < from + count; i++) seatPlayer(room, player(i), `J${i}`, snap(`mon${i}`))
}
