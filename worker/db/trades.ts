import { MAX_OPEN_LISTINGS, type TradeAsk, type TradeGood } from '../../src/game/trade/tradeGoods'
import { InboxReason, type InboxEntry, type TradeListing } from '../../src/game/trade/tradeProtocol'

// Anuncios y Notificaciones de los intercambios en D1 (tablas trade_listings y trade_inbox): lecturas y lo que no toca
// ninguna partida (caducar y retirar). Lo que cambia una partida va en worker/db/tradeWrites.ts.

/** Anuncios de los demás como mucho en el tablón */
const BOARD_SIZE = 60
/** Milisegundos reales que se guardan los anuncios cerrados y lo ya recogido antes de borrarlos */
const KEEP_CLOSED_MS = 7 * 24 * 60 * 60 * 1000

export const ListingStatus = { Open: 'open', Sold: 'sold', Expired: 'expired', Withdrawn: 'withdrawn' } as const

interface ListingRow {
  id: string
  seller_id: string
  nickname: string | null
  offer: string
  ask: string
  created_at: number
  expires_at: number
}

export interface StoredListing extends TradeListing {
  sellerId: string
}

const fromRow = (r: ListingRow): StoredListing => ({
  id: r.id,
  sellerId: r.seller_id,
  sellerName: r.nickname,
  offer: JSON.parse(r.offer) as TradeGood,
  ask: JSON.parse(r.ask) as TradeAsk,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
})

const LISTING_SELECT = `SELECT trade_listings.*, users.nickname FROM trade_listings JOIN users ON users.id = seller_id`

/** Un anuncio aún abierto; null si no existe o ya se ha cerrado */
export async function openListing(db: D1Database, id: string, now: number): Promise<StoredListing | null> {
  const row = await db
    .prepare(`${LISTING_SELECT} WHERE trade_listings.id = ? AND status = ? AND expires_at > ?`)
    .bind(id, ListingStatus.Open, now)
    .first<ListingRow>()
  return row && fromRow(row)
}

/** Los anuncios abiertos de los demás, los más nuevos primero; con `species`, solo los que ofrecen o piden alguna */
export async function boardListings(db: D1Database, userId: string, now: number, species: number[]): Promise<StoredListing[]> {
  const marks = species.map(() => '?').join(', ')
  const search = species.length
    ? `AND (offer_species IN (${marks}) OR EXISTS (SELECT 1 FROM json_each(ask, '$.speciesIds') WHERE value IN (${marks})))`
    : ''
  const { results } = await db
    .prepare(`${LISTING_SELECT} WHERE status = ? AND expires_at > ? AND seller_id <> ? ${search} ORDER BY created_at DESC LIMIT ?`)
    .bind(ListingStatus.Open, now, userId, ...species, ...species, BOARD_SIZE)
    .all<ListingRow>()
  return results.map(fromRow)
}

export async function myListings(db: D1Database, userId: string, now: number): Promise<StoredListing[]> {
  const { results } = await db
    .prepare(`${LISTING_SELECT} WHERE seller_id = ? AND status = ? AND expires_at > ? ORDER BY created_at`)
    .bind(userId, ListingStatus.Open, now)
    .all<ListingRow>()
  return results.map(fromRow)
}

interface InboxRow {
  id: string
  good: string
  reason: InboxReason
  created_at: number
}

const inboxFromRow = (r: InboxRow): InboxEntry => ({ id: r.id, good: JSON.parse(r.good) as TradeGood, reason: r.reason, createdAt: r.created_at })

/** Lo que la cuenta tiene pendiente de recoger, lo más antiguo primero */
export async function pendingInbox(db: D1Database, userId: string): Promise<InboxEntry[]> {
  const { results } = await db
    .prepare('SELECT id, good, reason, created_at FROM trade_inbox WHERE user_id = ? AND claimed_at IS NULL ORDER BY created_at')
    .bind(userId)
    .all<InboxRow>()
  return results.map(inboxFromRow)
}

export async function inboxEntry(db: D1Database, userId: string, id: string): Promise<InboxEntry | null> {
  const row = await db
    .prepare('SELECT id, good, reason, created_at FROM trade_inbox WHERE id = ? AND user_id = ? AND claimed_at IS NULL')
    .bind(id, userId)
    .first<InboxRow>()
  return row && inboxFromRow(row)
}

export async function hasRoomForListing(db: D1Database, userId: string): Promise<boolean> {
  const open = await db.prepare('SELECT COUNT(*) AS n FROM trade_listings WHERE seller_id = ? AND status = ?').bind(userId, ListingStatus.Open).first<number>('n')
  return (open ?? 0) < MAX_OPEN_LISTINGS
}

export const newTradeId = (): string => crypto.randomUUID().replaceAll('-', '')

/** Cierra el anuncio abierto (`where`) devolviendo lo ofrecido a su dueño en Notificaciones, todo en un lote */
function closeAndReturn(db: D1Database, status: string, reason: InboxReason, where: string, values: (string | number)[], now: number) {
  return db.batch([
    db
      .prepare(`INSERT INTO trade_inbox (id, user_id, good, reason, listing_id, created_at) SELECT lower(hex(randomblob(16))), seller_id, offer, ?, id, ? FROM trade_listings WHERE status = ? AND ${where}`)
      .bind(reason, now, ListingStatus.Open, ...values),
    db.prepare(`UPDATE trade_listings SET status = ?, closed_at = ? WHERE status = ? AND ${where}`).bind(status, now, ListingStatus.Open, ...values),
  ])
}

/** Los anuncios que llevan LISTING_MS sin aceptarse vuelven a su dueño; se borra lo cerrado o recogido hace mucho */
export async function expireListings(db: D1Database, now: number) {
  await closeAndReturn(db, ListingStatus.Expired, InboxReason.Expired, 'expires_at <= ?', [now], now)
  await db.batch([
    db.prepare('DELETE FROM trade_listings WHERE status <> ? AND closed_at < ?').bind(ListingStatus.Open, now - KEEP_CLOSED_MS),
    db.prepare('DELETE FROM trade_inbox WHERE claimed_at < ?').bind(now - KEEP_CLOSED_MS),
  ])
}

/** Retira un anuncio propio aún abierto (vuelve a Notificaciones); false si ya no lo estaba */
export async function withdrawListing(db: D1Database, userId: string, id: string, now: number): Promise<boolean> {
  const [, closed] = await closeAndReturn(db, ListingStatus.Withdrawn, InboxReason.Withdrawn, 'id = ? AND seller_id = ?', [id, userId], now)
  return closed.meta.changes === 1
}
