import type { FeedRequest, JoinRequest, RaidFeed, RaidResponse, RoomView, SyncRequest } from '../game/raid/online/protocol'

/** Dirección del servidor de salas (worker/raid.ts) */
const RAID_API = '/api/raid'
/** Milisegundos reales que se espera al servidor antes de darlo por perdido */
const REQUEST_TIMEOUT_MS = 8_000

/** Error de red o del servidor: sin él (p. ej. con `npm run dev`), las salas se juegan en local */
export class RaidApiError extends Error {}

async function post(req: JoinRequest | SyncRequest | FeedRequest): Promise<RaidResponse> {
  let res: Response
  try {
    res = await fetch(RAID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (e) {
    throw new RaidApiError(`Sin conexión con el servidor de salas: ${String(e)}`)
  }
  const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? ((await res.json()) as RaidResponse) : null
  if (!body) throw new RaidApiError(`El servidor de salas respondió ${res.status}`)
  return body
}

/** Entrar o ponerse al día: la sala vista por el jugador (null si ya no existe o no hay jefe al que entrar) */
export async function postRaid(req: JoinRequest | SyncRequest): Promise<RoomView | null> {
  const body = await post(req)
  if (!('view' in body)) throw new RaidApiError('El servidor de salas no ha devuelto la sala')
  return body.view ?? null
}

/** Lo que hay ahora en la pestaña Raids */
export async function postFeed(req: FeedRequest): Promise<RaidFeed> {
  const { feed } = await post(req)
  if (!feed) throw new RaidApiError('El servidor de salas no ha devuelto la pestaña Raids')
  return feed
}
