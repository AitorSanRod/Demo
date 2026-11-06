import type { CloudSave } from '../../src/game/core/cloudSave'
import { goodSpecies, LISTING_MS, MAX_OPEN_LISTINGS, type TradeAsk, type TradeGood } from '../../src/game/trade/tradeGoods'
import { InboxReason } from '../../src/game/trade/tradeProtocol'
import { tradeSaveStatement } from './saves'
import { ListingStatus, newTradeId, type StoredListing } from './trades'

// Lo que cambia la partida de la nube de un jugador y los anuncios a la vez: cada operación es un lote (una transacción)
// en el que cada paso solo se hace si el anterior se ha hecho, así no puede quedar un anuncio sin partida cambiada ni al
// revés, y dos jugadores no pueden quedarse con el mismo anuncio.

const changed = (result: D1Result) => result.meta.changes === 1

/** El anuncio está vendido a ese comprador en ese momento (lo acaba de cerrar el primer paso del lote) */
const SOLD_TO_BUYER = 'id = ? AND status = ? AND buyer_id = ? AND closed_at = ?'

/** Publica el anuncio y guarda la partida sin lo anunciado (`cloud`); false si la nube cambió o ya hay demasiados */
export async function insertListing(db: D1Database, userId: string, cloud: CloudSave, offer: TradeGood, ask: TradeAsk, now: number): Promise<boolean> {
  const [saved] = await db.batch([
    tradeSaveStatement(db, userId, cloud, '(SELECT COUNT(*) FROM trade_listings WHERE seller_id = ? AND status = ?) < ?', [userId, ListingStatus.Open, MAX_OPEN_LISTINGS]),
    db
      .prepare(
        `INSERT INTO trade_listings (id, seller_id, offer, offer_species, ask, status, created_at, expires_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM saves WHERE user_id = ? AND revision = ? AND updated_at = ?)`,
      )
      .bind(newTradeId(), userId, JSON.stringify(offer), goodSpecies(offer), JSON.stringify(ask), ListingStatus.Open, now, now + LISTING_MS, userId, cloud.revision, cloud.updatedAt),
  ])
  return changed(saved)
}

/**
 * El comprador se queda el anuncio: se cierra (solo si sigue abierto y la partida del comprador sigue en la revisión
 * anterior), se guarda su partida sin el pago (`cloud`) y van a Notificaciones lo comprado y lo cobrado
 */
export async function sellListing(db: D1Database, buyerId: string, cloud: CloudSave, listing: StoredListing, payment: TradeGood, now: number): Promise<boolean> {
  const soldValues = [listing.id, ListingStatus.Sold, buyerId, now]
  const toInbox = (userColumn: string, good: string, reason: InboxReason) =>
    db
      .prepare(`INSERT INTO trade_inbox (id, user_id, good, reason, listing_id, created_at) SELECT ?, ${userColumn}, ?, ?, id, ? FROM trade_listings WHERE ${SOLD_TO_BUYER}`)
      .bind(newTradeId(), good, reason, now, ...soldValues)
  const [sold] = await db.batch([
    db
      .prepare(
        `UPDATE trade_listings SET status = ?, buyer_id = ?, closed_at = ?
         WHERE id = ? AND status = ? AND expires_at > ? AND seller_id <> ? AND EXISTS (SELECT 1 FROM saves WHERE user_id = ? AND revision = ?)`,
      )
      .bind(ListingStatus.Sold, buyerId, now, listing.id, ListingStatus.Open, now, buyerId, buyerId, cloud.revision - 1),
    tradeSaveStatement(db, buyerId, cloud, `EXISTS (SELECT 1 FROM trade_listings WHERE ${SOLD_TO_BUYER})`, soldValues),
    toInbox('buyer_id', JSON.stringify(listing.offer), InboxReason.Bought),
    toInbox('seller_id', JSON.stringify(payment), InboxReason.Sold),
  ])
  return changed(sold)
}

/** Marca como recogido lo pendiente y guarda la partida con ello dentro (`cloud`); false si ya no estaba o la nube cambió */
export async function claimInboxEntry(db: D1Database, userId: string, cloud: CloudSave, entryId: string, now: number): Promise<boolean> {
  const [claimed] = await db.batch([
    db
      .prepare('UPDATE trade_inbox SET claimed_at = ? WHERE id = ? AND user_id = ? AND claimed_at IS NULL AND EXISTS (SELECT 1 FROM saves WHERE user_id = ? AND revision = ?)')
      .bind(now, entryId, userId, userId, cloud.revision - 1),
    tradeSaveStatement(db, userId, cloud, 'EXISTS (SELECT 1 FROM trade_inbox WHERE id = ? AND claimed_at = ?)', [entryId, now]),
  ])
  return changed(claimed)
}
