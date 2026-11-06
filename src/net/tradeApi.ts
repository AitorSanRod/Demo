import { act } from '../game/core/store'
import { applyTradeOp, type TradeOpResult } from '../game/trade/tradeOps'
import { TradeAction, TradeCode, type TradeBoard, type TradeOpResponse, type TradeRequest } from '../game/trade/tradeProtocol'
import { withCloudInSync } from './cloudSync'

// Peticiones de intercambio al servidor (worker/trade.ts). Las que cambian la partida van con la partida recién subida
// (withCloudInSync): el servidor la cambia en la nube y aquí se repite el mismo cambio con la operación que devuelve.

const TRADE_API = '/api/trade'

const ERROR_TEXT: Record<string, string> = {
  [TradeCode.Gone]: 'Ese anuncio ya no está: lo ha aceptado otro jugador, ha caducado o se ha retirado.',
  [TradeCode.Full]: 'Ya tienes el máximo de anuncios abiertos.',
  [TradeCode.Blocked]: 'Ya no se puede: revisa que sigas teniendo lo necesario (y sitio, si es un Pokémon).',
  [TradeCode.Own]: 'Es tu propio anuncio.',
  [TradeCode.Invalid]: 'Petición no válida.',
}
const NETWORK_ERROR = 'No se ha podido hablar con el servidor. Prueba otra vez.'

/** Lo hecho o, si no se ha podido, por qué en palabras del jugador */
export type TradeOutcome = { result: TradeOpResult } | { error: string }

type OpRequest = TradeRequest extends infer R ? (R extends { baseRevision: number } ? Omit<R, 'baseRevision'> : never) : never

async function post(body: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(TRADE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}

/** Anunciar, aceptar o recoger: cambia la partida aquí y en la nube a la vez */
export async function tradeOp(request: OpRequest): Promise<TradeOutcome> {
  try {
    return await withCloudInSync(async (baseRevision, adoptRevision) => {
      const { ok, data } = await post({ ...request, baseRevision })
      if (!ok && data.code === TradeCode.Stale) throw new Error('La partida de la nube ha cambiado')
      if (!ok) return { error: ERROR_TEXT[data.code as string] ?? NETWORK_ERROR }
      const response = data as unknown as TradeOpResponse
      const result = act((s) => applyTradeOp(s, response.op))
      if (!result) throw new Error('La partida de aquí no admite el cambio de la nube')
      adoptRevision(response.revision)
      return { result }
    })
  } catch {
    return { error: NETWORK_ERROR }
  }
}

/** Pide retirar un anuncio propio; el servidor decide si aún se puede. null si no se ha podido preguntar */
export async function requestWithdraw(listingId: string): Promise<boolean | null> {
  try {
    const { ok, data } = await post({ action: TradeAction.Withdraw, listingId })
    return ok ? data.withdrawn === true : null
  } catch {
    return null
  }
}

/** El tablón (con `species`, solo lo que ofrece o pide alguna de esas especies) */
export async function fetchBoard(species: number[]): Promise<TradeBoard> {
  const query = species.length ? `?species=${species.join(',')}` : ''
  const res = await fetch(TRADE_API + query, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${TRADE_API}: ${res.status}`)
  return (await res.json()) as TradeBoard
}
