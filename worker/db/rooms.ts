import { takeDamageTally } from '../../src/game/raid/online/damageTally'
import { channelKey, ROUTE_CHANNEL_PREFIX, type RoomChannel, type RoomSummary } from '../../src/game/raid/online/protocol'
import { ROOM_TTL_MS } from '../../src/game/raid/online/roomServer'
import { ROOM_MAX_CATCHUP_MS } from '../../src/game/raid/online/sharedRoom'
import { playersIn, type SharedRoom } from '../../src/game/raid/online/sharedRoom'
import { roomSummary } from '../../src/game/raid/online/tabRooms'
import { addDamage } from './damageRanking'

// Las salas compartidas en D1 (tabla rooms). Cada escritura comprueba la versión leída: si otro jugador escribió la
// sala entre medias, no se guarda y la petición se repite. Con cada sala se guardan sus jugadores y su resumen, para
// listarlas sin abrir su JSON. Al terminar la pelea, quien guarda o borra la sala apunta su daño en el ranking (una sola
// vez: la marca va en la misma escritura con versión).

/** Salas de ruta que se listan como mucho */
const MAX_LISTED_ROUTE_ROOMS = 30

/** Una sala tal y como se leyó; `version` null: aún no está guardada */
export interface StoredRoom {
  room: SharedRoom
  version: number | null
}

interface RoomRow {
  data: string
  version: number
}

const fromRow = (row: RoomRow): StoredRoom => ({ room: JSON.parse(row.data) as SharedRoom, version: row.version })

export async function loadRoom(db: D1Database, roomId: string): Promise<StoredRoom | null> {
  const row = await db.prepare('SELECT data, version FROM rooms WHERE id = ?').bind(roomId).first<RoomRow>()
  return row && fromRow(row)
}

/** Todas las salas de un jefe */
export async function loadChannel(db: D1Database, channel: RoomChannel): Promise<StoredRoom[]> {
  const { results } = await db.prepare('SELECT data, version FROM rooms WHERE channel = ?').bind(channelKey(channel)).all<RoomRow>()
  return results.map(fromRow)
}

/** Resúmenes de las salas de las paradas de ruta con jugadores dentro y consultadas hace poco */
export async function loadRouteSummaries(db: D1Database, now: number): Promise<RoomSummary[]> {
  const { results } = await db
    .prepare('SELECT summary FROM rooms WHERE channel LIKE ? AND players > 0 AND updated_at > ? ORDER BY players DESC LIMIT ?')
    .bind(`${ROUTE_CHANNEL_PREFIX}%`, now - ROOM_TTL_MS, MAX_LISTED_ROUTE_ROOMS)
    .all<{ summary: string | null }>()
  return results.flatMap((r) => (r.summary ? [JSON.parse(r.summary) as RoomSummary] : []))
}

/** Guarda la sala si nadie la ha cambiado desde que se leyó (o si es nueva); false si otro llegó antes */
export async function saveRoom(db: D1Database, { room, version }: StoredRoom): Promise<boolean> {
  const tally = takeDamageTally(room)
  const data = JSON.stringify(room)
  // Con el jefe caído o escapado la pelea ha terminado: ya no cuenta como sala con jugadores (ni sale en las listas)
  const players = room.closed || room.raid.hp === 0 ? 0 : playersIn(room)
  const summary = JSON.stringify(roomSummary(room, false))
  const statement =
    version === null
      ? db
          .prepare('INSERT INTO rooms (id, channel, data, version, updated_at, players, summary) VALUES (?, ?, ?, 1, ?, ?, ?) ON CONFLICT (id) DO NOTHING')
          .bind(room.id, channelKey(room.channel), data, room.updatedAt, players, summary)
      : db
          .prepare('UPDATE rooms SET data = ?, version = version + 1, updated_at = ?, players = ?, summary = ? WHERE id = ? AND version = ?')
          .bind(data, room.updatedAt, players, summary, room.id, version)
  const { meta } = await statement.run()
  if (meta.changes !== 1) return false
  await addDamage(db, tally)
  return true
}

/** Guarda varias salas (las que se han leído llevan su versión en `versions`); false si alguna la cambió otro antes */
export async function saveRooms(db: D1Database, rooms: SharedRoom[], versions: Map<SharedRoom, number>): Promise<boolean> {
  for (const room of rooms) if (!(await saveRoom(db, { room, version: versions.get(room) ?? null }))) return false
  return true
}

/** Borra la sala si nadie la ha cambiado desde que se leyó; false si otro llegó antes */
export async function deleteRoom(db: D1Database, { room, version }: StoredRoom): Promise<boolean> {
  if (version === null) return true
  const tally = takeDamageTally(room)
  const { meta } = await db.prepare('DELETE FROM rooms WHERE id = ? AND version = ?').bind(room.id, version).run()
  if (meta.changes !== 1) return false
  await addDamage(db, tally)
  return true
}

/**
 * Borra las salas de parada sin jugadores dentro (terminadas o solo con bots) que nadie ha tocado en
 * ROOM_MAX_CATCHUP_MS: quien siguiera con la app cerrada más tiempo ya no se pone al día con ella, sigue en local
 */
export async function deleteIdleStopRooms(db: D1Database, now: number) {
  await db
    .prepare('DELETE FROM rooms WHERE channel LIKE ? AND players = 0 AND updated_at < ?')
    .bind(`${ROUTE_CHANNEL_PREFIX}%`, now - ROOM_MAX_CATCHUP_MS)
    .run()
}

export async function deleteRooms(db: D1Database, roomIds: string[]) {
  if (roomIds.length > 0) await db.batch(roomIds.map((id) => db.prepare('DELETE FROM rooms WHERE id = ?').bind(id)))
}
