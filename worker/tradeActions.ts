import { stateFromSaved, type CloudSave } from '../src/game/core/cloudSave'
import { backupTeam } from '../src/game/core/teamBackup'
import { goodText } from '../src/game/trade/goodText'
import { applyTradeOp, TradeOpKind, type TradeOp, type TradeOpResult } from '../src/game/trade/tradeOps'
import { TradeAction, TradeCode, type TradeOpResponse, type TradeRequest } from '../src/game/trade/tradeProtocol'
import { loadSave } from './db/saves'
import { hasRoomForListing, inboxEntry, openListing, withdrawListing } from './db/trades'
import { claimInboxEntry, insertListing, sellListing } from './db/tradeWrites'
import { json } from './http'
import { notifyTrade } from './push/notify'

// Las operaciones de intercambio de una cuenta. Las que cambian la partida se hacen sobre la de la nube, que el móvil
// acaba de subir (`baseRevision`): el servidor aplica la operación, guarda la partida y el anuncio en un solo lote y
// responde con la operación para que el móvil la repita sobre la suya.

type Post<A extends TradeAction> = Extract<TradeRequest, { action: A }>

const fail = (code: TradeCode) => json({ code }, 409)

const done = (cloud: CloudSave, op: TradeOp) => json({ revision: cloud.revision, op } satisfies TradeOpResponse)

interface Prepared {
  cloud: CloudSave
  result: TradeOpResult
}

/** La partida de la nube con la operación aplicada, lista para guardar; o por qué no se puede */
async function prepare(db: D1Database, userId: string, base: number, op: TradeOp, now: number): Promise<Prepared | TradeCode> {
  const saved = await loadSave(db, userId)
  if (!saved || saved.revision !== base) return TradeCode.Stale
  const s = stateFromSaved(saved.save, saved.team)
  const result = applyTradeOp(s, op)
  if (!result) return TradeCode.Blocked
  return { cloud: { save: s, team: backupTeam(s), revision: base + 1, updatedAt: now }, result }
}

export async function listOffer(db: D1Database, userId: string, req: Post<'list'>, now: number): Promise<Response> {
  if (!(await hasRoomForListing(db, userId))) return fail(TradeCode.Full)
  const op: TradeOp = { kind: TradeOpKind.List, offer: req.offer }
  const prepared = await prepare(db, userId, req.baseRevision, op, now)
  if (typeof prepared === 'string') return fail(prepared)
  if (!(await insertListing(db, userId, prepared.cloud, prepared.result.good, req.ask, now))) return fail(TradeCode.Stale)
  return done(prepared.cloud, op)
}

export async function acceptListing(db: D1Database, userId: string, req: Post<'accept'>, now: number): Promise<Response> {
  const listing = await openListing(db, req.listingId, now)
  if (!listing) return fail(TradeCode.Gone)
  if (listing.sellerId === userId) return fail(TradeCode.Own)
  const op: TradeOp = { kind: TradeOpKind.Pay, ask: listing.ask, uid: req.uid }
  const prepared = await prepare(db, userId, req.baseRevision, op, now)
  if (typeof prepared === 'string') return fail(prepared)
  const payment = prepared.result.good
  if (!(await sellListing(db, userId, prepared.cloud, listing, payment, now))) {
    return fail((await openListing(db, listing.id, now)) ? TradeCode.Stale : TradeCode.Gone)
  }
  const body = `Te han dado ${goodText(payment)} por ${goodText(listing.offer)}. Recógelo en Notificaciones.`
  await notifyTrade(db, listing.sellerId, `sold:${listing.id}`, 'Intercambio hecho', body, now)
  return done(prepared.cloud, op)
}

export async function claimEntry(db: D1Database, userId: string, req: Post<'claim'>, now: number): Promise<Response> {
  const entry = await inboxEntry(db, userId, req.inboxId)
  if (!entry) return fail(TradeCode.Gone)
  const op: TradeOp = { kind: TradeOpKind.Claim, good: entry.good }
  const prepared = await prepare(db, userId, req.baseRevision, op, now)
  if (typeof prepared === 'string') return fail(prepared)
  if (!(await claimInboxEntry(db, userId, prepared.cloud, entry.id, now))) {
    return fail((await inboxEntry(db, userId, entry.id)) ? TradeCode.Stale : TradeCode.Gone)
  }
  return done(prepared.cloud, op)
}

/** Retirar no cambia la partida: lo anunciado vuelve a Notificaciones. Se avisa de cómo ha acabado */
export async function withdrawOffer(db: D1Database, userId: string, req: Post<'withdraw'>, now: number): Promise<Response> {
  const withdrawn = await withdrawListing(db, userId, req.listingId, now)
  const [title, body] = withdrawn
    ? ['Anuncio retirado', 'Lo que anunciaste te espera en Notificaciones.']
    : ['No se ha podido retirar', 'El anuncio ya se había cerrado: mira tus Notificaciones.']
  await notifyTrade(db, userId, `withdraw:${req.listingId}`, title, body, now)
  return json({ withdrawn })
}
