import { parseAsk, parseOffer, type OfferRequest, type TradeAsk, type TradeGood } from './tradeGoods'
import type { TradeOp } from './tradeOps'

// Lo que se dicen la web (net/tradeApi.ts) y el servidor (worker/trade.ts) sobre los intercambios: el tablón, las
// peticiones y sus respuestas.

/** Un anuncio abierto, tal y como lo ve la web */
export interface TradeListing {
  id: string
  /** Apodo del vendedor (null si no ha elegido ninguno) */
  sellerName: string | null
  offer: TradeGood
  ask: TradeAsk
  createdAt: number
  /** Hora real (ms) a la que vuelve a su dueño si nadie lo acepta */
  expiresAt: number
}

/** Por qué ha llegado algo a Notificaciones */
export const InboxReason = { Sold: 'sold', Bought: 'bought', Expired: 'expired', Withdrawn: 'withdrawn' } as const
export type InboxReason = (typeof InboxReason)[keyof typeof InboxReason]

/** Algo pendiente de recoger en Notificaciones */
export interface InboxEntry {
  id: string
  good: TradeGood
  reason: InboxReason
  createdAt: number
}

/** El tablón: anuncios de los demás (los más nuevos), los propios abiertos y lo pendiente de recoger */
export interface TradeBoard {
  listings: TradeListing[]
  mine: TradeListing[]
  inbox: InboxEntry[]
  serverNow: number
}

/** Especies como mucho en una búsqueda del tablón */
export const MAX_SEARCH_SPECIES = 60

export const TradeAction = { List: 'list', Accept: 'accept', Withdraw: 'withdraw', Claim: 'claim' } as const
export type TradeAction = (typeof TradeAction)[keyof typeof TradeAction]

/**
 * Peticiones al servidor. `baseRevision` es la revisión de la partida en la nube que el móvil acaba de subir: el
 * servidor solo aplica la operación encima de esa
 */
export type TradeRequest =
  | { action: typeof TradeAction.List; baseRevision: number; offer: OfferRequest; ask: TradeAsk }
  | { action: typeof TradeAction.Accept; baseRevision: number; listingId: string; uid: string | null }
  | { action: typeof TradeAction.Withdraw; listingId: string }
  | { action: typeof TradeAction.Claim; baseRevision: number; inboxId: string }

/** Respuesta a una operación que cambia la partida: la revisión nueva y la operación que el móvil debe repetir */
export interface TradeOpResponse {
  revision: number
  op: TradeOp
}

/** Por qué no se ha hecho una operación */
export const TradeCode = {
  Invalid: 'invalid',
  /** La partida de la nube no es la que el móvil cree: hay que volver a bajarla */
  Stale: 'stale',
  /** El anuncio ya no está abierto (vendido, caducado o retirado) */
  Gone: 'gone',
  Full: 'full',
  /** No se puede: lo que se da no está, o no hay sitio para lo que se recoge */
  Blocked: 'blocked',
  Own: 'own',
  NoSave: 'no_save',
} as const
export type TradeCode = (typeof TradeCode)[keyof typeof TradeCode]

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64
const isRevision = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0

/** La petición si tiene la forma de una; si no, null */
export function parseTradeRequest(body: unknown): TradeRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.action === TradeAction.Withdraw) return isId(b.listingId) ? { action: b.action, listingId: b.listingId } : null
  if (!isRevision(b.baseRevision)) return null
  if (b.action === TradeAction.List) {
    const offer = parseOffer(b.offer)
    const ask = parseAsk(b.ask)
    return offer && ask ? { action: b.action, baseRevision: b.baseRevision, offer, ask } : null
  }
  if (b.action === TradeAction.Accept) {
    const uid = b.uid === null || isId(b.uid) ? b.uid : undefined
    return isId(b.listingId) && uid !== undefined ? { action: b.action, baseRevision: b.baseRevision, listingId: b.listingId, uid } : null
  }
  if (b.action === TradeAction.Claim) return isId(b.inboxId) ? { action: b.action, baseRevision: b.baseRevision, inboxId: b.inboxId } : null
  return null
}
