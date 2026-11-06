import type { Rng } from '../../core/random'
import { hasRoom, presentMembers, RaidMemberKind } from '../raidRoom'
import { ROUTE_RAID_JOIN_MIN_HP } from '../stopRoom'
import { RoomSlot, type JoinChannel, type JoinRequest, type RoomView, type SyncRequest } from './protocol'
import { catchUp, createRoom, isOver, playersIn, seatPlayer, seatsOf, unseatPlayer, viewFor, type SharedRoom } from './sharedRoom'

// Las acciones del servidor de salas, sin el almacén: el servidor carga las salas, llama aquí y guarda lo que cambie.
// Las de la pestaña Raids van además por ciclos (tabRooms.ts).

/** Una sala sin consultas en este tiempo (ms reales) se borra: nadie la mira ni va a cobrar de ella */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000

export const isExpired = (room: SharedRoom, now: number): boolean => now - room.updatedAt > ROOM_TTL_MS

/**
 * Sala de parada terminada y sin nadie dentro: todos sus jugadores ya saben cómo acabó (o se fueron antes) y se borra.
 * Las de la pestaña Raids no: las lleva el ciclo (tabRooms.ts)
 */
export const isSettled = (room: SharedRoom): boolean => room.channel.slot === RoomSlot.Route && isOver(room) && playersIn(room) === 0

/** Cabe alguien más: hay hueco o un bot que echar */
export const canMakeRoom = (room: SharedRoom) => hasRoom(room.raid) || presentMembers(room.raid).some((m) => m.kind === RaidMemberKind.Bot)

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

/** Petición de entrar en la sala de una parada de ruta */
type StopJoinRequest = JoinRequest & { channel: Extract<JoinChannel, { slot: typeof RoomSlot.Route }> }

/** Entrar en una parada: se ponen al día sus salas y el Pokémon se sienta en la elegida o en una nueva (`newId`) */
export function joinStopRoom(rooms: SharedRoom[], req: StopJoinRequest, now: number, rng: Rng, newId: () => string): SharedRoom {
  for (const room of rooms) catchUp(room, now, rng)
  const room = pickRoom(rooms, req.playerId) ?? createRoom(req.channel, newId(), now, req.bossHp, rng)
  seatPlayer(room, req.playerId, req.nickname, req.mon)
  return room
}

/**
 * Ponerse al día: se juega la sala hasta ahora y el jugador queda dentro o fuera según lo que pida. En una parada
 * terminada sale al verlo: con esta respuesta su ruta ya sigue y la sala no le hace falta
 */
export function syncRoom(room: SharedRoom, req: SyncRequest, now: number, rng: Rng): RoomView {
  catchUp(room, now, rng)
  if (req.mon) seatPlayer(room, req.playerId, req.nickname, req.mon)
  else unseatPlayer(room, req.playerId)
  const view = viewFor(room, req.playerId)
  if (room.channel.slot === RoomSlot.Route && isOver(room)) unseatPlayer(room, req.playerId)
  return view
}
