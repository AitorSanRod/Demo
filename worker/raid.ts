import { channelKey, RaidAction, RoomSlot, type JoinRequest, type RaidRequest, type RaidResponse, type RoomView, type SyncRequest } from '../src/game/raid/online/protocol'
import { parseRequest } from '../src/game/raid/online/requests'
import { isExpired, isSettled, joinStopRoom, syncRoom } from '../src/game/raid/online/roomServer'
import { fallPush } from '../src/game/raid/online/raidPushes'
import { viewFor } from '../src/game/raid/online/sharedRoom'
import { deleteRoom, deleteRooms, loadChannel, loadRoom, saveRoom } from './db/rooms'
import type { Env } from './env'
import { json, readJson } from './http'
import { notifyRaid } from './push/notify'
import { CONFLICT, feedTab, joinTab, noteTabFall } from './raidTab'

// POST /api/raid: salas compartidas de los jefes comunitarios (RaidRequest, ver src/game/raid/online/protocol.ts).
// Toda la lógica es la del juego; aquí solo se lee y se guarda en D1. Sin cuentas: el jugador va por su id. Las de la
// pestaña Raids van por ciclos (raidTab.ts); las de las paradas de ruta, aquí.

/** Veces que se repite una petición si otro jugador ha escrito la sala justo a la vez */
const MAX_ATTEMPTS = 5
/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8
/** Bytes como mucho de una petición de sala */
const MAX_REQUEST_BYTES = 16 * 1024

type Outcome = RaidResponse | typeof CONFLICT

const viewed = async (view: Promise<RoomView | null | typeof CONFLICT>): Promise<Outcome> => {
  const v = await view
  return v === CONFLICT ? CONFLICT : { view: v }
}

async function joinStop(db: D1Database, req: JoinRequest): Promise<RoomView | typeof CONFLICT> {
  if (req.channel.slot !== RoomSlot.Route) throw new Error('joinStop solo es para paradas de ruta')
  const channel = req.channel
  const now = Date.now()
  const stored = await loadChannel(db, channel)
  const expired = stored.filter((s) => isExpired(s.room, now))
  await deleteRooms(
    db,
    expired.map((s) => s.room.id),
  )
  const live = stored.filter((s) => !expired.includes(s))
  const newId = () => `${channelKey(channel)}/${crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)}`
  const room = joinStopRoom(
    live.map((s) => s.room),
    { ...req, channel },
    now,
    Math.random,
    newId,
  )
  const version = live.find((s) => s.room === room)?.version ?? null
  return (await saveRoom(db, { room, version })) ? viewFor(room, req.playerId) : CONFLICT
}

async function sync(db: D1Database, req: SyncRequest): Promise<RoomView | null | typeof CONFLICT> {
  const now = Date.now()
  const stored = await loadRoom(db, req.roomId)
  if (!stored) return null
  if (isExpired(stored.room, now)) {
    await deleteRooms(db, [req.roomId])
    return null
  }
  const standing = stored.room.raid.hp > 0
  const view = syncRoom(stored.room, req, now, Math.random)
  // Una parada terminada de la que ya han salido todos no se guarda: se borra
  const kept = isSettled(stored.room) ? await deleteRoom(db, stored) : await saveRoom(db, stored)
  if (!kept) return CONFLICT
  if (!(await noteTabFall(db, stored.room, now))) return CONFLICT
  const fell = standing && stored.room.raid.hp === 0 ? fallPush(stored.room, now) : null
  if (fell) await notifyRaid(db, [fell], req.playerId)
  return view
}

function handle(db: D1Database, req: RaidRequest): Promise<Outcome> {
  if (req.action === RaidAction.Feed) return feedTab(db, req).then((feed) => (feed === CONFLICT ? CONFLICT : { feed }))
  if (req.action === RaidAction.Sync) return viewed(sync(db, req))
  return viewed(req.channel.slot === RoomSlot.Tab ? joinTab(db, req) : joinStop(db, req))
}

export async function raidRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = await handle(env.DB, req)
    if (outcome !== CONFLICT) return json(outcome)
  }
  return json({ error: 'La sala está muy concurrida; prueba otra vez' }, 503)
}
