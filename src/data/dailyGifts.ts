// Obsequio diario de las cuentas (ver game/collection/dailyGift.ts). Este fichero es para editarlo a mano: cada
// entrada es un día del ciclo, en orden; al recoger el último se vuelve al primero.

/** Lo que da un día del ciclo */
export interface DailyGift {
  money: number
  /** Trozos de MissingNo */
  missingnoShards: number
  /** Tickets de gacha */
  tickets: number
  /** Día grande: se destaca en la lista */
  big: boolean
}

const gift = (contents: Partial<DailyGift>): DailyGift => ({ money: 0, missingnoShards: 0, tickets: 0, big: false, ...contents })

/** Los días del ciclo, en orden */
export const DAILY_GIFTS: DailyGift[] = [
  gift({ money: 2000 }),
  gift({ missingnoShards: 50 }),
  gift({ tickets: 3 }),
  gift({ money: 1000, missingnoShards: 50, tickets: 1, big: true }),
]
