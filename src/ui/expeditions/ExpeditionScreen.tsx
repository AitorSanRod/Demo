import { useState } from 'react'
import { KANTO, type Route } from '../../data/maps'
import { MonPlace, monPlace, type GameState } from '../../game/core/state'
import { expeditionRouteBlocker, expeditionSlots, expeditionsBlocker } from '../../game/team/expedition'
import { RouteLock, RouteRow, RouteRowTitle } from '../route/RouteRow'
import { ExpeditionList } from './ExpeditionList'
import { ExpeditionStartDialog } from './ExpeditionStartDialog'
import './expeditions.css'

/** Pestaña Expediciones: las que están en curso y, debajo, la lista de rutas a las que mandar a alguien del rancho */
export function ExpeditionScreen({ game }: { game: GameState }) {
  const [sending, setSending] = useState<Route | null>(null)
  const home = game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch)
  const slots = expeditionSlots(game)
  const blocker = expeditionsBlocker(game)

  return (
    <div className="screen scroll">
      <div className="row between">
        <h2 className="section-title">En expedición</h2>
        <span className="small muted">
          Huecos {game.expeditions.length}/{slots}
        </span>
      </div>
      <ExpeditionList game={game} />

      <h2 className="section-title">Mandar de expedición</h2>
      {blocker && <p className="notice">{blocker}</p>}
      <div className="route-list">
        {KANTO.routes.map((r) => {
          const routeBlocker = expeditionRouteBlocker(game, r.id)
          return (
            <RouteRow key={r.id} route={r} locked={!!routeBlocker} disabled={!!blocker} onClick={() => setSending(r)}>
              <RouteRowTitle route={r} />
              {routeBlocker && <RouteLock reason={routeBlocker} />}
            </RouteRow>
          )
        })}
      </div>
      <p className="tiny muted">
        Solo se puede mandar a las rutas ya completadas. En expedición no hay riesgo: el Pokémon vuelve con lo que haya ganado.
      </p>
      {sending && home.length > 0 && <ExpeditionStartDialog game={game} route={sending} mons={home} onClose={() => setSending(null)} />}
    </div>
  )
}
