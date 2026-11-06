import type { GameState } from '../core/state'
import { payAsk, takeOffer } from './tradeGive'
import type { OfferRequest, TradeAsk, TradeGood } from './tradeGoods'
import { receiveGood, type DuplicateRefund } from './tradeReceive'

// Las operaciones de intercambio que cambian la partida. El servidor las aplica sobre la partida de la nube, en la misma
// transacción que el anuncio, y el móvil repite la misma sobre la suya: así nada se pierde ni se duplica. Cada una sube
// el sello de intercambios (`tradeStamp`): el servidor no acepta subir una partida con un sello más viejo.

export const TradeOpKind = { List: 'list', Pay: 'pay', Claim: 'claim' } as const
export type TradeOpKind = (typeof TradeOpKind)[keyof typeof TradeOpKind]

/** Anunciar algo, pagar un anuncio (con el Pokémon `uid` si se pide uno) o recoger algo de Notificaciones */
export type TradeOp =
  | { kind: typeof TradeOpKind.List; offer: OfferRequest }
  | { kind: typeof TradeOpKind.Pay; ask: TradeAsk; uid: string | null }
  | { kind: typeof TradeOpKind.Claim; good: TradeGood }

/** Lo que ha salido de la partida (o entrado, al recoger) y, si llegó un Pokémon repetido, lo que se dio en su lugar */
export interface TradeOpResult {
  good: TradeGood
  duplicate: DuplicateRefund | null
}

function apply(s: GameState, op: TradeOp): TradeOpResult | null {
  if (op.kind === TradeOpKind.Claim) return receiveGood(s, op.good)
  const good = op.kind === TradeOpKind.List ? takeOffer(s, op.offer) : payAsk(s, op.ask, op.uid)
  return good && { good, duplicate: null }
}

/** Aplica la operación y sube el sello; null si no se puede (y la partida queda como estaba) */
export function applyTradeOp(s: GameState, op: TradeOp): TradeOpResult | null {
  const result = apply(s, op)
  if (result) s.tradeStamp++
  return result
}
