import type { Route } from '../../data/maps'
import type { GameState } from '../../game/core/state'

/** Premio por completar la ruta; los tickets de primera vez solo se anuncian mientras no se haya completado */
export function RouteReward({ game, r }: { game: GameState; r: Route }) {
  const { tickets, money, exp, firstClearTickets } = r.reward
  const parts = [`₽ ${money}`, `${exp} EXP`]
  if (tickets > 0) parts.push(`🎟 ${tickets}`)
  if (firstClearTickets && !game.completedRoutes.includes(r.id)) parts.push(`🎟 +${firstClearTickets} la primera vez`)
  return <span className="small muted">Premio: {parts.join(' · ')}</span>
}
