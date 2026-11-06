import { catchUp } from '../src/game/raid/online/sharedRoom'
import { fallPush } from '../src/game/raid/online/raidPushes'
import { deleteIdleStopRooms, saveRoom, type StoredRoom } from './db/rooms'
import { expireListings } from './db/trades'
import type { Env } from './env'
import { notifyRaid } from './push/notify'
import { sendDuePushes } from './push/send'
import { refreshRanking } from './ranking'
import { tickTab } from './raidTab'

// La tarea programada (cron, cada minuto; ver wrangler.jsonc): pone al día las raids aunque nadie tenga la app abierta
// (así se sabe cuándo cae un jefe o aparece el siguiente), borra las salas de parada que ya no usa nadie, devuelve a su
// dueño los anuncios de intercambio caducados, rehace el ranking cada hora y manda los avisos push que ya tocan.

/** La sala de parada con jugadores que lleva más tiempo sin consultas (sus jugadores pueden tener la app cerrada) */
async function stalestStopRoom(db: D1Database): Promise<StoredRoom | null> {
  const row = await db
    .prepare("SELECT data, version FROM rooms WHERE channel LIKE 'route/%' AND players > 0 ORDER BY updated_at LIMIT 1")
    .first<{ data: string; version: number }>()
  return row && { room: JSON.parse(row.data), version: row.version }
}

async function tickStopRoom(db: D1Database, now: number) {
  const stored = await stalestStopRoom(db)
  if (!stored || stored.room.raid.hp === 0) return
  catchUp(stored.room, now, Math.random)
  if (!(await saveRoom(db, stored))) return
  const fell = stored.room.raid.hp === 0 ? fallPush(stored.room, now) : null
  if (fell) await notifyRaid(db, [fell])
}

export async function scheduled(env: Env) {
  const now = Date.now()
  await tickTab(env.DB, now).catch((e: unknown) => console.error('Raids: no se ha podido poner al día el ciclo', e))
  await tickStopRoom(env.DB, now).catch((e: unknown) => console.error('Raids: no se ha podido poner al día una parada', e))
  await deleteIdleStopRooms(env.DB, now).catch((e: unknown) => console.error('Raids: no se han podido borrar las paradas viejas', e))
  await expireListings(env.DB, now).catch((e: unknown) => console.error('Intercambios: no se han podido caducar los anuncios', e))
  await refreshRanking(env.DB, now).catch((e: unknown) => console.error('Ranking: no se ha podido rehacer', e))
  await sendDuePushes(env, now)
}
