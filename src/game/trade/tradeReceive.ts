import { markCaught } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import type { GameState } from '../core/state'
import { createMon } from '../team/mons'
import { BOX_SLOTS, boxedMons, ranchWithRoom } from '../team/ranches'
import { maxHp } from '../team/stats'
import { GoodKind, type TradedMon, type TradeGood } from './tradeGoods'

// Lo que entra en la partida al recoger de Notificaciones (lo comprado, lo cobrado o lo devuelto). Solo se puede tener
// un Pokémon de cada especie: si ya se tiene, el que llega se cambia por tickets de su especie y dinero.

/** Tickets de su especie por un Pokémon repetido */
export const DUPLICATE_BASE_PIECES = 5
/** Tickets más por cada ★ del Pokémon repetido */
export const DUPLICATE_PIECES_PER_STAR = 5
/** ₽ que se dan además por un Pokémon repetido */
export const DUPLICATE_MONEY = 1000

/** Lo que se recibe en lugar de un Pokémon repetido */
export interface DuplicateRefund {
  speciesId: number
  pieces: number
  money: number
}

export const isDuplicate = (s: GameState, speciesId: number): boolean => s.owned.some((m) => m.speciesId === speciesId)

export const duplicateRefund = (mon: TradedMon): DuplicateRefund => ({
  speciesId: mon.speciesId,
  pieces: DUPLICATE_BASE_PIECES + DUPLICATE_PIECES_PER_STAR * mon.stars,
  money: DUPLICATE_MONEY,
})

/** Dónde se queda un Pokémon que llega: el primer rancho con sitio, la Caja (null) o ninguno (undefined) */
function destinationOf(s: GameState, speciesId: number): number | null | undefined {
  const ranch = ranchWithRoom(s, speciesId)
  if (ranch !== null) return ranch
  return boxedMons(s).length < BOX_SLOTS ? null : undefined
}

/** Por qué no se puede recoger aún (un Pokémon sin sitio en ningún rancho ni en la Caja); null si se puede */
export function receiveBlocker(s: GameState, good: TradeGood): string | null {
  if (good.kind !== GoodKind.Mon || isDuplicate(s, good.mon.speciesId)) return null
  return destinationOf(s, good.mon.speciesId) === undefined ? 'No hay sitio en los ranchos ni en la Caja.' : null
}

/** Lo que ha entrado en la partida: lo recibido y, si era un Pokémon repetido, lo que se ha dado en su lugar */
export interface ReceiveResult {
  good: TradeGood
  duplicate: DuplicateRefund | null
}

function receiveMon(s: GameState, traded: TradedMon): DuplicateRefund | null {
  if (isDuplicate(s, traded.speciesId)) {
    const refund = duplicateRefund(traded)
    addPieces(s, refund.speciesId, refund.pieces)
    s.money += refund.money
    return refund
  }
  const mon = { ...createMon(traded.speciesId, traded.level, destinationOf(s, traded.speciesId)), exp: traded.exp, stars: traded.stars }
  mon.hp = maxHp(mon)
  s.owned.push(mon)
  markCaught(s, traded.speciesId)
  return null
}

/** Mete en la partida lo recibido; null si aún no se puede (sin sitio para el Pokémon) */
export function receiveGood(s: GameState, good: TradeGood): ReceiveResult | null {
  if (receiveBlocker(s, good)) return null
  let duplicate: DuplicateRefund | null = null
  if (good.kind === GoodKind.Mon) duplicate = receiveMon(s, good.mon)
  else if (good.kind === GoodKind.Pieces) addPieces(s, good.speciesId, good.count)
  else if (good.kind === GoodKind.Shards) s.missingnoShards += good.count
  else if (good.kind === GoodKind.Money) s.money += good.count
  else s.tickets += good.count
  return { good, duplicate }
}
