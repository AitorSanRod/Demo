import { channelKey, RaidAction, type JoinRequest, type RoomView, type SyncRequest } from '../src/game/raid/online/protocol'
import { parseRequest } from '../src/game/raid/online/requests'
import { isExpired, joinRoom, syncRoom } from '../src/game/raid/online/roomServer'
import { viewFor } from '../src/game/raid/online/sharedRoom'
import { deleteRooms, loadChannel, loadRoom, saveRoom } from './db/rooms'
import type { Env } from './env'
import { json, readJson } from './http'

// POST /api/raid: salas compartidas de los jefes comunitarios (RaidRequest, ver src/game/raid/online/protocol.ts).
// Toda la lógica es la del juego; aquí solo se lee y se guarda en D1. Sin cuentas: el jugador va por su id.

/** Veces que se repite una petición si otro jugador ha escrito la sala justo a la vez */
const MAX_ATTEMPTS = 5
/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8
/** Bytes como mucho de una petición de sala */
const MAX_REQUEST_BYTES = 16 * 1024

/** Otro jugador escribió la sala entre la lectura y la escritura: hay que repetir */
const CONFLICT = Symbol('conflict')
type Outcome = RoomView | null | typeof CONFLICT

const newRoomId = (req: JoinRequest) => `${channelKey(req.channel)}/${crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)}`

async function join(db: D1Database, req: JoinRequest): Promise<Outcome> {
  const now = Date.now()
  const stored = await loadChannel(db, req.channel)
  const expired = stored.filter((s) => isExpired(s.room, now))
  await deleteRooms(
    db,
    expired.map((s) => s.room.id),
  )
  const live = stored.filter((s) => !expired.includes(s))
  const room = joinRoom(
    live.map((s) => s.room),
    req,
    now,
    Math.random,
    () => newRoomId(req),
  )
  const version = live.find((s) => s.room === room)?.version ?? null
  return (await saveRoom(db, { room, version })) ? viewFor(room, req.playerId) : CONFLICT
}

async function sync(db: D1Database, req: SyncRequest): Promise<Outcome> {
  const now = Date.now()
  const stored = await loadRoom(db, req.roomId)
  if (!stored) return null
  if (isExpired(stored.room, now)) {
    await deleteRooms(db, [req.roomId])
    return null
  }
  const view = syncRoom(stored.room, req, now, Math.random)
  return (await saveRoom(db, stored)) ? view : CONFLICT
}

export async function raidRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = req.action === RaidAction.Join ? await join(env.DB, req) : await sync(env.DB, req)
    if (outcome !== CONFLICT) return json({ view: outcome })
  }
  return json({ error: 'La sala está muy concurrida; prueba otra vez' }, 503)
}
