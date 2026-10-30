import { useState } from 'react'
import { KANTO, route } from '../../data/maps'
import type { GameState, OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import {
  EXPEDITION_DURATIONS,
  expeditionBattles,
  expeditionBlocker,
  expeditionWinRate,
  sendExpedition,
} from '../../game/team/expedition'
import { formatMinutes } from '../shared/format'

/** Enviar a un Pokémon del rancho de expedición: ruta, duración y lo que se puede esperar */
export function ExpeditionForm({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const routes = KANTO.routes.filter((r) => game.unlockedRoutes.includes(r.id))
  const [routeId, setRouteId] = useState(routes[routes.length - 1].id)
  const [duration, setDuration] = useState(EXPEDITION_DURATIONS[1])
  const blocker = expeditionBlocker(game, mon.uid)
  const winPct = Math.round(expeditionWinRate(mon, route(routeId)) * 100)

  return (
    <div className="expedition-form">
      <div className="label">Ruta</div>
      <div className="row gap">
        {routes.map((r) => (
          <button key={r.id} className={`btn small ${routeId === r.id ? 'primary' : ''}`} onClick={() => setRouteId(r.id)}>
            {r.name}
          </button>
        ))}
      </div>
      <div className="label">Duración</div>
      <div className="row gap">
        {EXPEDITION_DURATIONS.map((d) => (
          <button key={d} className={`btn small ${duration === d ? 'primary' : ''}`} onClick={() => setDuration(d)}>
            {formatMinutes(d)}
          </button>
        ))}
      </div>
      <p className="small muted">
        ~{expeditionBattles(duration)} combates · {winPct}% de victorias. Al volver gana {route(routeId).reward.exp} EXP
        (los combates solo dan ₽ y tickets), sin riesgo.
      </p>
      {blocker && <p className="notice small">{blocker}</p>}
      <button
        className="btn primary wide"
        disabled={!!blocker}
        onClick={() => act((s) => sendExpedition(s, mon.uid, routeId, duration))}
      >
        Enviar a {route(routeId).name}
      </button>
    </div>
  )
}
