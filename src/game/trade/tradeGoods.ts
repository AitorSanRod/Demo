import { SPECIES } from '../../data/species'

// Intercambios entre jugadores (worker/trade.ts): qué se puede poner a la venta, qué se puede pedir a cambio y sus
// límites. Lo comparten la web y el servidor, que comprueba todo lo que le llega con estas mismas reglas.

/** Anuncios abiertos a la vez por jugador */
export const MAX_OPEN_LISTINGS = 3
/** Milisegundos reales que dura un anuncio sin que nadie lo acepte; después vuelve a su dueño */
export const LISTING_MS = 24 * 60 * 60 * 1000
/** Especies que se pueden pedir a cambio de un anuncio (el comprador entrega solo una de ellas) */
export const MAX_ASKED_SPECIES = 3
/** Tickets, trozos o tickets gacha como mucho en un anuncio (ofrecidos o pedidos) */
export const MAX_TRADE_COUNT = 999
/** ₽ como mucho que se pueden pedir por un anuncio */
export const MAX_TRADE_MONEY = 1_000_000

export const GoodKind = { Mon: 'mon', Pieces: 'pieces', Shards: 'shards', Money: 'money', Tickets: 'tickets' } as const
export type GoodKind = (typeof GoodKind)[keyof typeof GoodKind]

/** Un Pokémon que cambia de dueño: llega tal cual estaba (nivel, EXP y ★), con los PS al máximo */
export interface TradedMon {
  speciesId: number
  level: number
  exp: number
  stars: number
}

/** Cantidades sueltas: trozos de MissingNo, dinero o tickets de gacha */
type CountKind = typeof GoodKind.Shards | typeof GoodKind.Money | typeof GoodKind.Tickets

/** Algo que cambia de manos: lo anunciado, lo pagado o lo que se devuelve */
export type TradeGood =
  | { kind: typeof GoodKind.Mon; mon: TradedMon }
  | { kind: typeof GoodKind.Pieces; speciesId: number; count: number }
  | { kind: CountKind; count: number }

/** Lo que el vendedor quiere poner a la venta: un Pokémon suyo, tickets de una especie o trozos de MissingNo */
export type OfferRequest =
  | { kind: typeof GoodKind.Mon; uid: string }
  | { kind: typeof GoodKind.Pieces; speciesId: number; count: number }
  | { kind: typeof GoodKind.Shards; count: number }

/** Lo que pide a cambio, de un solo tipo: un Pokémon de una de las especies, dinero, trozos o tickets de gacha */
export type TradeAsk = { kind: typeof GoodKind.Mon; speciesIds: number[] } | { kind: CountKind; count: number }

const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))
export const isSpeciesId = (v: unknown): v is number => SPECIES_IDS.has(v as number)
const isCount = (v: unknown, max = MAX_TRADE_COUNT): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= max

/** Lo que se quiere anunciar, si tiene la forma y los límites de un anuncio; si no, null */
export function parseOffer(v: unknown): OfferRequest | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (o.kind === GoodKind.Mon) return typeof o.uid === 'string' && o.uid ? { kind: GoodKind.Mon, uid: o.uid } : null
  if (o.kind === GoodKind.Pieces) return isSpeciesId(o.speciesId) && isCount(o.count) ? { kind: GoodKind.Pieces, speciesId: o.speciesId, count: o.count } : null
  if (o.kind === GoodKind.Shards) return isCount(o.count) ? { kind: GoodKind.Shards, count: o.count } : null
  return null
}

/** Lo que se pide a cambio, si tiene la forma y los límites de un anuncio; si no, null */
export function parseAsk(v: unknown): TradeAsk | null {
  if (!v || typeof v !== 'object') return null
  const a = v as Record<string, unknown>
  if (a.kind === GoodKind.Mon) {
    const ids = Array.isArray(a.speciesIds) ? [...new Set(a.speciesIds)] : []
    const valid = ids.length >= 1 && ids.length <= MAX_ASKED_SPECIES && ids.every(isSpeciesId)
    return valid ? { kind: GoodKind.Mon, speciesIds: ids } : null
  }
  if (a.kind === GoodKind.Money) return isCount(a.count, MAX_TRADE_MONEY) ? { kind: GoodKind.Money, count: a.count } : null
  if (a.kind === GoodKind.Shards || a.kind === GoodKind.Tickets) return isCount(a.count) ? { kind: a.kind, count: a.count } : null
  return null
}

/** Especie de lo que cambia de manos (Pokémon o tickets de una especie); null si son cantidades sueltas */
export function goodSpecies(good: TradeGood): number | null {
  if (good.kind === GoodKind.Mon) return good.mon.speciesId
  return good.kind === GoodKind.Pieces ? good.speciesId : null
}
