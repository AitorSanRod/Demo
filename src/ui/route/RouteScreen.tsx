import { useState } from 'react'
import { activeMon, type GameState } from '../../game/core/state'
import { isExpeditionDone } from '../../game/team/expedition'
import { ExpeditionScreen } from '../expeditions/ExpeditionScreen'
import { RouteMap } from './RouteMap'
import { RunView } from './RunView'
import './route.css'

type RouteTab = 'route' | 'expeditions'

/** Pestaña Ruta: la ruta del Pokémon activo (mapa o ruta en curso) y las expediciones del resto del equipo */
export function RouteScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<RouteTab>('route')
  const mon = activeMon(game)
  const returned = game.expeditions.filter(isExpeditionDone).length

  return (
    <div className="screen tabbed">
      <div className="segmented tabbed-bar">
        <button className={tab === 'route' ? 'active' : ''} onClick={() => setTab('route')}>
          🗺️ Ruta
        </button>
        <button className={tab === 'expeditions' ? 'active' : ''} onClick={() => setTab('expeditions')}>
          🧭 Expediciones {returned > 0 && <span className="count-badge">{returned}</span>}
        </button>
      </div>
      <div className="tabbed-body">
        {tab === 'expeditions' ? (
          <ExpeditionScreen game={game} />
        ) : game.run && mon ? (
          <RunView game={game} run={game.run} mon={mon} />
        ) : (
          <RouteMap game={game} />
        )}
      </div>
    </div>
  )
}
