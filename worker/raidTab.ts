import { channelKey, RoomSlot, type FeedRequest, type JoinRequest, type RaidFeed, type RoomView } from '../src/game/raid/online/protocol'
import { featuredRoom, noteFalls, type RaidCycle } from '../src/game/raid/online/raidCycle'
import { isExpired } from '../src/game/raid/online/roomServer'
import { viewFor, type SharedRoom } from '../src/game/raid/online/sharedRoom'
import { joinTabRoom, tabFeed, updateCycle, type CycleUpdate } from '../src/game/raid/online/tabRooms'
import { loadCycle, saveCycle, type StoredCycle } from './db/cycle'
import { deleteRooms, loadChannel, loadRouteSummaries, saveRooms } from './db/rooms'
import { notifyRaid } from './push/notify'

// La pestaña Raids en el Worker: el ciclo del jefe (src/game/raid/online/raidCycle.ts) y sus salas, en D1. Cada
// petición pone al día el ciclo y guarda lo que haya cambiado; si otro jugador escribió antes, se repite.

/** Otro jugador escribió el ciclo o una sala entre la lectura y la escritura: hay que repetir */
export const CONFLICT = Symbol('conflict')

/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8

const randomId = () => crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)

/** Id de una sala nueva del ciclo de ese momento (puede haber cambiado durante la petición) */
const newRoomIdIn = (cycle: RaidCycle) => () => `${channelKey({ slot: RoomSlot.Tab, cycle: cycle.number })}/${randomId()}`

/** El ciclo y las salas vivas de su jefe (las caducadas se borran), con la versión de cada una */
async function loadTab(db: D1Database, now: number) {
  const stored = await loadCycle(db)
  const all = await loadChannel(db, { slot: RoomSlot.Tab, cycle: stored.cycle.number })
  const expired = all.filter((s) => isExpired(s.room, now))
  await deleteRooms(
    db,
    expired.map((s) => s.room.id),
  )
  const live = all.filter((s) => !expired.includes(s))
  const versions = new Map(live.map((s) => [s.room, s.version!]))
  return { stored, rooms: live.map((s) => s.room), versions }
}

/**
 * Guarda las salas tocadas y, si ha cambiado, el ciclo; después programa los avisos de lo que ha pasado (salvo al
 * jugador de la petición). false si otro jugador escribió antes
 */
async function saveUpdate(db: D1Database, stored: StoredCycle, update: CycleUpdate, versions: Map<SharedRoom, number>, playerId: string | null): Promise<boolean> {
  if (!(await saveRooms(db, update.touched, versions))) return false
  if (update.cycleChanged && !(await saveCycle(db, stored))) return false
  await notifyRaid(db, update.pushes, playerId)
  return true
}

export async function joinTab(db: D1Database, req: JoinRequest): Promise<RoomView | null | typeof CONFLICT> {
  const now = Date.now()
  const { stored, rooms, versions } = await loadTab(db, now)
  const { update, room } = joinTabRoom(stored.cycle, rooms, req, now, Math.random, newRoomIdIn(stored.cycle))
  if (!(await saveUpdate(db, stored, update, versions, req.playerId))) return CONFLICT
  return room && viewFor(room, req.playerId)
}

export async function feedTab(db: D1Database, req: FeedRequest): Promise<RaidFeed | typeof CONFLICT> {
  const now = Date.now()
  const { stored, rooms, versions } = await loadTab(db, now)
  const shown = featuredRoom(stored.cycle, rooms, req.watchRoomId)?.id ?? null
  const update = updateCycle(stored.cycle, rooms, [shown, stored.cycle.mainRoomId], now, Math.random, newRoomIdIn(stored.cycle))
  if (!(await saveUpdate(db, stored, update, versions, req.playerId))) return CONFLICT
  const tab = tabFeed(stored.cycle, update.rooms, req.watchRoomId, req.playerId, now)
  return { ...tab, routeRooms: await loadRouteSummaries(db, now) }
}

/**
 * Lo que hace la tarea programada con la pestaña Raids aunque nadie tenga la app abierta: poner al día el ciclo (las
 * salas pendientes, la caída del jefe, el siguiente) y programar sus avisos
 */
export async function tickTab(db: D1Database, now: number): Promise<boolean> {
  const { stored, rooms, versions } = await loadTab(db, now)
  const update = updateCycle(stored.cycle, rooms, [stored.cycle.mainRoomId], now, Math.random, newRoomIdIn(stored.cycle))
  return saveUpdate(db, stored, update, versions, null)
}

/** Ha caído el jefe en una sala de la pestaña Raids al ponerse al día: si es del ciclo actual, este se cierra */
export async function noteTabFall(db: D1Database, room: SharedRoom, now: number): Promise<boolean> {
  if (room.channel.slot !== RoomSlot.Tab || room.raid.hp > 0) return true
  const stored = await loadCycle(db)
  if (room.channel.cycle !== stored.cycle.number || !noteFalls(stored.cycle, [room], now)) return true
  return saveCycle(db, stored)
}
