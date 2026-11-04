import type { Rng } from '../../core/random'
import { hasRoom, presentMembers, RaidMemberKind } from '../raidRoom'
import { ROUTE_RAID_JOIN_MIN_HP } from '../stopRoom'
import { RoomSlot, type JoinRequest, type RoomView, type SyncRequest } from './protocol'
import { catchUp, createRoom, playersIn, seatPlayer, seatsOf, unseatPlayer, viewFor, type SharedRoom } from './sharedRoom'

// Las dos acciones del servidor de salas, sin el almacén: el servidor carga las salas, llama aquí y guarda lo que cambie.

/** Una sala sin consultas en este tiempo (ms reales) se borra: nadie la mira ni va a cobrar de ella */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000

export const isExpired = (room: SharedRoom, now: number): boolean => now - room.updatedAt > ROOM_TTL_MS

const canMakeRoom = (room: SharedRoom) => hasRoom(room.raid) || presentMembers(room.raid).some((m) => m.kind === RaidMemberKind.Bot)

/**
 * Se puede entrar si el jefe sigue en pie (en una parada, por encima de ROUTE_RAID_JOIN_MIN_HP), hay hueco o un bot
 * que echar, y dentro hay otros jugadores o el jugador ya estuvo (una sala solo de bots no aporta nada: se abre otra)
 */
function joinable(room: SharedRoom, playerId: string): boolean {
  const { raid } = room
  const minHp = room.channel.slot === RoomSlot.Route ? raid.maxHp * ROUTE_RAID_JOIN_MIN_HP : 0
  const known = seatsOf(room, playerId).length > 0
  return raid.hp > minHp && (known || playersIn(room) > 0) && canMakeRoom(room)
}

/** La sala en la que ya estuvo el jugador o, si no, la que tenga más jugadores dentro; null si no vale ninguna */
export function pickRoom(rooms: SharedRoom[], playerId: string): SharedRoom | null {
  const open = rooms.filter((room) => joinable(room, playerId))
  const known = open.find((room) => seatsOf(room, playerId).length > 0)
  return known ?? open.sort((a, b) => playersIn(b) - playersIn(a))[0] ?? null
}

/** Entrar: se ponen al día las salas de ese jefe y el Pokémon se sienta en la elegida o en una nueva (`newId`) */
export function joinRoom(rooms: SharedRoom[], req: JoinRequest, now: number, rng: Rng, newId: () => string): SharedRoom {
  for (const room of rooms) catchUp(room, now, rng)
  const room = pickRoom(rooms, req.playerId) ?? createRoom(req.channel, newId(), now, req.bossHp, rng)
  seatPlayer(room, req.playerId, req.nickname, req.mon)
  return room
}

/** Ponerse al día: se juega la sala hasta ahora y el jugador queda dentro o fuera según lo que pida */
export function syncRoom(room: SharedRoom, req: SyncRequest, now: number, rng: Rng): RoomView {
  catchUp(room, now, rng)
  if (req.mon) seatPlayer(room, req.playerId, req.nickname, req.mon)
  else unseatPlayer(room, req.playerId)
  return viewFor(room, req.playerId)
}
