import type { GameState } from '../../game/core/state'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { useTradeBoard } from '../../net/tradeBoard'

/** Cuántas cosas hay en Notificaciones: el obsequio si está listo, los premios de raid y lo de los intercambios */
export function useInboxCount(game: GameState): number {
  const gift = useDailyGift()
  const trades = useTradeBoard().board?.inbox.length ?? 0
  return (giftReady(gift) ? 1 : 0) + game.raidPrizes.length + trades
}
