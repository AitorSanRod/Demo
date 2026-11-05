import { channelKey, RoomSlot, type FeedRequest, type JoinRequest, type RaidFeed, type RoomView } from '../src/game/raid/online/protocol'
import { cycleBosses, cycleChannel, featuredRoom, noteFalls, type RaidCycle } from '../src/game/raid/online/raidCycle'
import { isExpired } from '../src/game/raid/online/roomServer'
import { viewFor, type SharedRoom } from '../src/game/raid/online/sharedRoom'
import { joinRotation, joinTabRoom, tabFeed, updateCycle, type CycleUpdate } from '../src/game/raid/online/tabRooms'
import { loadCycles, saveCycle, type StoredCycle } from './db/cycle'
import { deleteRooms, loadChannel, loadRouteSummaries, saveRooms } from './db/rooms'
import { notifyRaid } from './push/notify'

// La pestaña Raids en el Worker: las rotaciones de jefes, cada una con su ciclo (src/game/raid/online/raidCycle.ts) y
// sus salas, en D1. Cada petición pone al día los ciclos y guarda lo que haya cambiado; si otro jugador escribió antes,
// se repite.

/** Otro jugador escribió el ciclo o una sala entre la lectura y la escritura: hay que repetir */
export const CONFLICT = Symbol('conflict')

/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8

const randomId = () => crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)

/** Id de una sala nueva del ciclo de ese momento (puede haber cambiado durante la petición) */
const newRoomIdIn = (cycle: RaidCycle) => () => `${channelKey(cycleChannel(cycle))}/${randomId()}`

/** Una rotación tal y como se leyó: su ciclo y las salas vivas de su jefe, con la versión de cada una */
interface Board {
  stored: StoredCycle
  rooms: SharedRoom[]
  versions: Map<SharedRoom, number>
}

/** El ciclo de una rotación y las salas vivas de su jefe (las caducadas se borran) */
async function loadBoard(db: D1Database, stored: StoredCycle, now: number): Promise<Board> {
  const all = await loadChannel(db, cycleChannel(stored.cycle))
  const expired = all.filter((s) => isExpired(s.room, now))
  await deleteRooms(
    db,
    expired.map((s) => s.room.id),
  )
  const live = all.filter((s) => !expired.includes(s))
  const versions = new Map(live.map((s) => [s.room, s.version!]))
  return { stored, rooms: live.map((s) => s.room), versions }
}

/** Todas las rotaciones, en el orden de RAID_ROTATIONS */
async function loadBoards(db: D1Database, now: number): Promise<Board[]> {
  const cycles = await loadCycles(db)
  return Promise.all(cycles.map((stored) => loadBoard(db, stored, now)))
}

/** Los jefes de las otras rotaciones: al elegir el siguiente al azar se evitan */
const takenBy = (boards: Board[], board: Board) => boards.filter((b) => b !== board).flatMap((b) => cycleBosses(b.stored.cycle))

/**
 * Guarda las salas tocadas y, si ha cambiado, el ciclo; después programa los avisos de lo que ha pasado (salvo al
 * jugador de la petición). false si otro jugador escribió antes
 */
async function saveUpdate(db: D1Database, board: Board, update: CycleUpdate, playerId: string | null): Promise<boolean> {
  if (!(await saveRooms(db, update.touched, board.versions))) return false
  if (update.cycleChanged && !(await saveCycle(db, board.stored))) return false
  await notifyRaid(db, update.pushes, playerId)
  return true
}

/** Pone al día todas las rotaciones; `focus`, las salas de cada una que hay que poner al día antes que las demás */
async function updateBoards(db: D1Database, boards: Board[], focus: (b: Board) => (string | null)[], now: number, playerId: string | null) {
  const updates: CycleUpdate[] = []
  for (const board of boards) {
    const { cycle } = board.stored
    const update = updateCycle(cycle, board.rooms, focus(board), now, Math.random, newRoomIdIn(cycle), takenBy(boards, board))
    if (!(await saveUpdate(db, board, update, playerId))) return CONFLICT
    updates.push(update)
  }
  return updates
}

export async function joinTab(db: D1Database, req: JoinRequest): Promise<RoomView | null | typeof CONFLICT> {
  const now = Date.now()
  const boards = await loadBoards(db, now)
  const rotation = joinRotation(
    boards.map((b) => ({ cycle: b.stored.cycle, rooms: b.rooms })),
    req,
  )
  const board = boards.find((b) => b.stored.cycle.rotation === rotation)!
  const { cycle } = board.stored
  const { update, room } = joinTabRoom(cycle, board.rooms, req, now, Math.random, newRoomIdIn(cycle), takenBy(boards, board))
  if (!(await saveUpdate(db, board, update, req.playerId))) return CONFLICT
  return room && viewFor(room, req.playerId)
}

export async function feedTab(db: D1Database, req: FeedRequest): Promise<RaidFeed | typeof CONFLICT> {
  const now = Date.now()
  const boards = await loadBoards(db, now)
  const shown = (b: Board) => [featuredRoom(b.stored.cycle, b.rooms, req.watchRoomId)?.id ?? null, b.stored.cycle.mainRoomId]
  const updates = await updateBoards(db, boards, shown, now, req.playerId)
  if (updates === CONFLICT) return CONFLICT
  const rotations = boards.map((b, i) => tabFeed(b.stored.cycle, updates[i].rooms, req.watchRoomId, req.playerId))
  return { serverNow: now, rotations, routeRooms: await loadRouteSummaries(db, now) }
}

/**
 * Lo que hace la tarea programada con la pestaña Raids aunque nadie tenga la app abierta: poner al día los ciclos (las
 * salas pendientes, la caída del jefe, el siguiente) y programar sus avisos
 */
export async function tickTab(db: D1Database, now: number): Promise<boolean> {
  const boards = await loadBoards(db, now)
  return (await updateBoards(db, boards, (b) => [b.stored.cycle.mainRoomId], now, null)) !== CONFLICT
}

/** Ha caído el jefe en una sala de la pestaña Raids al ponerse al día: si es del ciclo actual de su rotación, este se cierra */
export async function noteTabFall(db: D1Database, room: SharedRoom, now: number): Promise<boolean> {
  if (room.channel.slot !== RoomSlot.Tab || room.raid.hp > 0) return true
  const { rotation, cycle } = room.channel
  const stored = (await loadCycles(db)).find((s) => s.cycle.rotation === rotation)!
  if (cycle !== stored.cycle.number || !noteFalls(stored.cycle, [room], now)) return true
  return saveCycle(db, stored)
}
