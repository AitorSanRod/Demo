import { DAILY_GIFTS, type DailyGift } from '../../data/dailyGifts'
import type { GameState } from '../core/state'

// Obsequio diario de cada cuenta: se recoge como mucho una vez cada DAILY_GIFT_INTERVAL_MS y cada vez toca el
// siguiente de la lista (data/dailyGifts.ts), en ciclo. No se reinicia por pasar días sin entrar: siempre se recoge el
// siguiente. Lo lleva el servidor por cuenta (worker/gift.ts), para que no se pueda recoger dos veces desde dos móviles.

/** Milisegundos reales que tienen que pasar desde que se recoge uno hasta que se puede recoger el siguiente */
export const DAILY_GIFT_INTERVAL_MS = 24 * 60 * 60 * 1000

/** Lo que el servidor sabe del obsequio de una cuenta */
export interface DailyGiftState {
  /** Obsequios recogidos desde el principio: decide cuál toca (el ciclo no se reinicia nunca) */
  claimed: number
  /** Hora real (ms) a la que se recogió el último; null si nunca */
  lastClaimAt: number | null
}

export const noGiftsYet = (): DailyGiftState => ({ claimed: 0, lastClaimAt: null })

/** Posición en DAILY_GIFTS del obsequio que toca tras haber recogido `claimed` */
export const giftIndex = (claimed: number): number => claimed % DAILY_GIFTS.length

/** El obsequio que toca tras haber recogido `claimed` */
export const giftAt = (claimed: number): DailyGift => DAILY_GIFTS[giftIndex(claimed)]

/** Hora real a partir de la cual se puede recoger el siguiente (0: ya se puede) */
export const giftAvailableAt = (st: DailyGiftState): number => (st.lastClaimAt === null ? 0 : st.lastClaimAt + DAILY_GIFT_INTERVAL_MS)

export const canClaimGift = (st: DailyGiftState, now: number): boolean => now >= giftAvailableAt(st)

/** Recoge el que toca: devuelve el obsequio y deja el estado listo para el siguiente; null si aún no se puede */
export function claimGift(st: DailyGiftState, now: number): DailyGift | null {
  if (!canClaimGift(st, now)) return null
  const gift = giftAt(st.claimed)
  st.claimed++
  st.lastClaimAt = now
  return gift
}

/** Suma el obsequio a la partida */
export function applyGift(s: GameState, gift: DailyGift) {
  s.money += gift.money
  s.missingnoShards += gift.missingnoShards
  s.tickets += gift.tickets
}
