import { channelKey, type RoomChannel } from '../../src/game/raid/online/protocol'
import type { SharedRoom } from '../../src/game/raid/online/sharedRoom'

// Las salas compartidas en D1 (tabla rooms). Cada escritura comprueba la versión leída: si otro jugador escribió la
// sala entre medias, no se guarda y la petición se repite.

/** Una sala tal y como se leyó; `version` null: aún no está guardada */
interface StoredRoom {
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

/** Guarda la sala si nadie la ha cambiado desde que se leyó (o si es nueva); false si otro llegó antes */
export async function saveRoom(db: D1Database, { room, version }: StoredRoom): Promise<boolean> {
  const data = JSON.stringify(room)
  const statement =
    version === null
      ? db
          .prepare('INSERT INTO rooms (id, channel, data, version, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT (id) DO NOTHING')
          .bind(room.id, channelKey(room.channel), data, room.updatedAt)
      : db.prepare('UPDATE rooms SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(data, room.updatedAt, room.id, version)
  const { meta } = await statement.run()
  return meta.changes === 1
}

export async function deleteRooms(db: D1Database, roomIds: string[]) {
  if (roomIds.length > 0) await db.batch(roomIds.map((id) => db.prepare('DELETE FROM rooms WHERE id = ?').bind(id)))
}
