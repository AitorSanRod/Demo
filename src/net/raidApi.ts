import type { RaidRequest, RaidResponse, RoomView } from '../game/raid/online/protocol'

/** Dirección de la función de Netlify (netlify/functions/raid.mts) */
const RAID_API = '/api/raid'
/** Milisegundos reales que se espera al servidor antes de darlo por perdido */
const REQUEST_TIMEOUT_MS = 8_000

/** Error de red o del servidor: sin él (p. ej. `npm run dev` o GitHub Pages), las salas se juegan en local */
export class RaidApiError extends Error {}

/** Manda la petición y devuelve la sala vista por el jugador (null si ya no existe) */
export async function postRaid(req: RaidRequest): Promise<RoomView | null> {
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
  if (!body || !('view' in body)) throw new RaidApiError(`El servidor de salas respondió ${res.status}`)
  return body.view
}
