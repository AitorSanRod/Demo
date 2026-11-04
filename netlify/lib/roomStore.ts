import { getStore } from '@netlify/blobs'
import { channelKey, type RoomChannel } from '../../src/game/raid/online/protocol'
import type { SharedRoom } from '../../src/game/raid/online/sharedRoom'

// Las salas compartidas en Netlify Blobs: una entrada por sala en `room/<jefe>/<id>`. Se escribe con su etag para
// que dos jugadores que consultan a la vez no se pisen: si otro ha escrito antes, la escritura falla y se reintenta.

/** Nombre del almacén de Blobs del sitio */
const STORE_NAME = 'raid-rooms'

/**
 * Una sala tal y como se leyó, con la etiqueta de su versión. `fresh`: aún no está guardada. Sin etiqueta (el Blobs
 * local de `netlify dev` no la da al leer) se guarda sin comprobar
 */
export interface StoredRoom {
  room: SharedRoom
  etag: string | null
  fresh?: boolean
}

// Lectura fuerte: cada consulta ve la última escritura, no una copia en caché de hace unos segundos
const store = () => getStore({ name: STORE_NAME, consistency: 'strong' })

const keyOf = (roomId: string) => `room/${roomId}`

export async function loadRoom(roomId: string, listedEtag: string | null = null): Promise<StoredRoom | null> {
  const entry = await store().getWithMetadata(keyOf(roomId), { type: 'json' })
  return entry ? { room: entry.data as SharedRoom, etag: entry.etag ?? listedEtag } : null
}

/** Todas las salas de un jefe */
export async function loadChannel(channel: RoomChannel): Promise<StoredRoom[]> {
  const { blobs } = await store().list({ prefix: `room/${channelKey(channel)}/` })
  const rooms = await Promise.all(blobs.map((b) => loadRoom(b.key.slice('room/'.length), b.etag || null)))
  return rooms.filter((r): r is StoredRoom => r !== null)
}

/** Guarda la sala si nadie la ha cambiado desde que se leyó (o si es nueva); false si otro llegó antes */
export async function saveRoom({ room, etag, fresh }: StoredRoom): Promise<boolean> {
  const condition = fresh ? { onlyIfNew: true } : etag ? { onlyIfMatch: etag } : {}
  const result = await store().setJSON(keyOf(room.id), room, condition)
  return result.modified
}

export async function deleteRoom(roomId: string) {
  await store().delete(keyOf(roomId))
}
