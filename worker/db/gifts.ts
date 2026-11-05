import { DAILY_GIFT_INTERVAL_MS, noGiftsYet, type DailyGiftState } from '../../src/game/collection/dailyGift'

// El obsequio diario de cada cuenta en D1 (tabla daily_gifts)

interface GiftRow {
  claimed: number
  last_claim_at: number
}

const fromRow = (row: GiftRow): DailyGiftState => ({ claimed: row.claimed, lastClaimAt: row.last_claim_at })

export async function loadGiftState(db: D1Database, userId: string): Promise<DailyGiftState> {
  const row = await db.prepare('SELECT claimed, last_claim_at FROM daily_gifts WHERE user_id = ?').bind(userId).first<GiftRow>()
  return row ? fromRow(row) : noGiftsYet()
}

/**
 * Recoge el obsequio si ya toca, en una sola consulta (dos móviles a la vez no pueden recoger dos): devuelve el estado
 * tras recogerlo, o null si aún no han pasado DAILY_GIFT_INTERVAL_MS desde el último
 */
export async function claimGiftRow(db: D1Database, userId: string, now: number): Promise<DailyGiftState | null> {
  const row = await db
    .prepare(
      `INSERT INTO daily_gifts (user_id, claimed, last_claim_at) VALUES (?, 1, ?)
       ON CONFLICT (user_id) DO UPDATE SET claimed = claimed + 1, last_claim_at = excluded.last_claim_at
       WHERE daily_gifts.last_claim_at <= ?
       RETURNING claimed, last_claim_at`,
    )
    .bind(userId, now, now - DAILY_GIFT_INTERVAL_MS)
    .first<GiftRow>()
  return row && fromRow(row)
}
