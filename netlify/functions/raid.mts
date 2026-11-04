import { channelKey, RaidAction, type JoinRequest, type RoomView, type SyncRequest } from '../../src/game/raid/online/protocol'
import { parseRequest } from '../../src/game/raid/online/requests'
import { isExpired, joinRoom, syncRoom } from '../../src/game/raid/online/roomServer'
import { viewFor } from '../../src/game/raid/online/sharedRoom'
import { deleteRoom, loadChannel, loadRoom, saveRoom, type StoredRoom } from '../lib/roomStore'

// Servidor de las salas compartidas de los jefes comunitarios: POST /api/raid con una RaidRequest (ver
// src/game/raid/online/protocol.ts). Toda la lógica es la del juego; aquí solo se lee y se guarda en Netlify Blobs.

/** Veces que se repite una petición si otro jugador ha escrito la sala justo a la vez */
const MAX_ATTEMPTS = 5
/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8

/** Otro jugador escribió la sala entre la lectura y la escritura: hay que repetir */
const CONFLICT = Symbol('conflict')
type Outcome = RoomView | null | typeof CONFLICT

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** Las salas caducadas se borran al pasar por ellas; devuelve las que siguen vivas */
async function liveRooms(rooms: StoredRoom[], now: number): Promise<StoredRoom[]> {
  const expired = rooms.filter((r) => isExpired(r.room, now))
  await Promise.all(expired.map((r) => deleteRoom(r.room.id)))
  return rooms.filter((r) => !expired.includes(r))
}

async function join(req: JoinRequest): Promise<Outcome> {
  const now = Date.now()
  const rooms = await liveRooms(await loadChannel(req.channel), now)
  const newId = () => `${channelKey(req.channel)}/${crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)}`
  const room = joinRoom(
    rooms.map((r) => r.room),
    req,
    now,
    Math.random,
    newId,
  )
  const stored = rooms.find((r) => r.room === room) ?? { room, etag: null, fresh: true }
  return (await saveRoom(stored)) ? viewFor(room, req.playerId) : CONFLICT
}

async function sync(req: SyncRequest): Promise<Outcome> {
  const now = Date.now()
  const stored = await loadRoom(req.roomId)
  if (!stored) return null
  if (isExpired(stored.room, now)) {
    await deleteRoom(req.roomId)
    return null
  }
  const view = syncRoom(stored.room, req, now, Math.random)
  return (await saveRoom(stored)) ? view : CONFLICT
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseRequest(await request.json().catch(() => null))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = req.action === RaidAction.Join ? await join(req) : await sync(req)
    if (outcome !== CONFLICT) return json({ view: outcome })
  }
  return json({ error: 'La sala está muy concurrida; prueba otra vez' }, 503)
}

export const config = { path: '/api/raid' }
