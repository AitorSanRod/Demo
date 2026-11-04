import { getStore } from '@netlify/blobs'
import type { CloudSave } from '../../src/game/core/cloudSave'

// Las partidas de las cuentas en Netlify Blobs: una entrada por cuenta en `user/<id de Netlify Identity>`.

/** Nombre del almacén de Blobs del sitio */
const STORE_NAME = 'saves'

/** La partida tal y como se leyó, con la etiqueta de su versión (null si el Blobs no la da, como el local) */
export interface StoredSave {
  cloud: CloudSave
  etag: string | null
}

const store = () => getStore({ name: STORE_NAME, consistency: 'strong' })

const keyOf = (userId: string) => `user/${userId}`

export async function loadSave(userId: string): Promise<StoredSave | null> {
  const entry = await store().getWithMetadata(keyOf(userId), { type: 'json' })
  return entry ? { cloud: entry.data as CloudSave, etag: entry.etag ?? null } : null
}

/** Guarda la partida si nadie la ha cambiado desde que se leyó `before` (o si no había); false si otro llegó antes */
export async function writeSave(userId: string, cloud: CloudSave, before: StoredSave | null): Promise<boolean> {
  const condition = !before ? { onlyIfNew: true } : before.etag ? { onlyIfMatch: before.etag } : {}
  const result = await store().setJSON(keyOf(userId), cloud, condition)
  return result.modified
}
