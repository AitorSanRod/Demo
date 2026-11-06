import { giftAt, giftAvailableAt, giftIndex, type DailyGiftState } from '../../src/game/collection/dailyGift'
import { PushTopic } from '../../src/game/core/push'
import type { RaidPush } from '../../src/game/raid/online/raidPushes'
import { enqueue } from './store'

// Programar los avisos que decide el servidor: los de las raids (al ver qué ha pasado en las salas), el del obsequio
// y los de los intercambios

/** Programa los avisos de las raids; al jugador que ha hecho la petición no se le avisa (tiene la app delante) */
export async function notifyRaid(db: D1Database, pushes: RaidPush[], exceptPlayerId: string | null = null) {
  for (const p of pushes) await enqueue(db, p.to, p.job, exceptPlayerId)
}

/** Deja programado el aviso de cuándo vuelve a tocar el obsequio de la cuenta */
export async function notifyNextGift(db: D1Database, userId: string, state: DailyGiftState) {
  const gift = giftAt(state.claimed)
  const day = `día ${giftIndex(state.claimed) + 1}${gift.big ? ', el día grande' : ''}`
  await enqueue(
    db,
    { userId },
    { topic: PushTopic.Gift, key: 'gift', dueAt: giftAvailableAt(state), title: 'Tu obsequio diario está listo', body: `Hoy toca el ${day}. Toca para recogerlo.` },
  )
}

/** Avisa ya a la cuenta de algo de sus intercambios (una venta hecha, una retirada resuelta) */
export async function notifyTrade(db: D1Database, userId: string, key: string, title: string, body: string, now: number) {
  await enqueue(db, { userId }, { topic: PushTopic.Trade, key, dueAt: now, title, body })
}
