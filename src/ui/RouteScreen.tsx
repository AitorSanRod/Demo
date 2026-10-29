import { useState } from 'react'
import { KANTO, node, pathFrom, type Route } from '../data/maps'
import { move } from '../data/moves'
import { species } from '../data/species'
import { isExpeditionDone } from '../game/expedition'
import { runBlocker, startRun } from '../game/run'
import { activeMon, type GameState } from '../game/state'
import { act } from '../game/store'
import { Sprite } from './common'
import { ExpeditionScreen } from './ExpeditionScreen'
import { RunView } from './RunView'
import { TutorialHint } from './TutorialHint'

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
          <RouteSelect game={game} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Selección de ruta

function RouteSelect({ game }: { game: GameState }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const blocker = runBlocker(game)
  const mon = activeMon(game)

  return (
    <div className="screen scroll">
      <h2 className="section-title">Mapa de {KANTO.name}</h2>
      {blocker && <p className="notice">{blocker}</p>}
      {mon && !blocker && (
        <p className="small muted">
          Sale {species(mon.speciesId).name} usando <strong>{move(mon.moveId).name}</strong>. Cámbialo en el rancho.
        </p>
      )}
      <div className="route-list">
        {KANTO.routes.map((r) => {
          const unlocked = game.unlockedRoutes.includes(r.id)
          const done = game.completedRoutes.includes(r.id)
          const open = unlocked && openId === r.id
          // En el tutorial se guía hasta la primera ruta, que es la única desbloqueada
          const guided = game.tutorial === 'route' && unlocked
          return (
            <div key={r.id} className={`card route-card ${unlocked ? '' : 'locked'}`}>
              <div className="route-card-head">
                <strong>{r.name}</strong>
                <span className="muted">Nv. {r.levels[0]}–{r.levels[1]}</span>
                {done && <span className="tag ok">Completada</span>}
              </div>
              <p className="muted small">{unlocked ? r.description : 'Completa la ruta anterior para desbloquearla.'}</p>
              {guided && !open && <TutorialHint arrowX="85%">Toca «Ver ruta» para ver sus paradas.</TutorialHint>}
              {unlocked && !open && (
                <div className="row between">
                  <RouteReward game={game} r={r} />
                  <button className={`btn ${guided ? 'tutorial-target' : ''}`} onClick={() => setOpenId(r.id)}>
                    Ver ruta
                  </button>
                </div>
              )}
              {open && <RoutePlanner game={game} route={r} canStart={!blocker} />}
            </div>
          )
        })}
      </div>
      <p className="tiny muted">Si te derrotan en una ruta, pierdes la mitad del dinero ganado en ella.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Planificación del camino

/** Todo se decide aquí, antes de salir: en las bifurcaciones se elige rama y el resto del camino se rehace */
function RoutePlanner({ game, route: r, canStart }: { game: GameState; route: Route; canStart: boolean }) {
  const [path, setPath] = useState(() => pathFrom(r))
  const choose = (i: number, to: string) => setPath([...path.slice(0, i + 1), ...pathFrom(r, to)])

  return (
    <div className="planner">
      <ol className="stop-list">
        {path.map((id, i) => {
          const n = node(r, id)
          const pool = [...new Set((n.encounters ?? r.encounters).map((e) => e.speciesId))]
          return (
            <li key={id} className="stop">
              <div className="row between">
                <strong className="small">{n.name}</strong>
                <span className="tiny muted">{n.levelBonus ? `Nv. +${n.levelBonus}` : ''}</span>
              </div>
              {n.kind === 'wild' && (
                <span className="pool mini">
                  {pool.slice(0, 6).map((sid) => (
                    <Sprite key={sid} id={sid} size={28} animated={false} silhouette={!game.seen.includes(sid)} />
                  ))}
                </span>
              )}
              {n.next.length > 1 && (
                <div className="row gap">
                  {n.next.map((e) => (
                    <button
                      key={e.to}
                      className={`btn small ${path[i + 1] === e.to ? 'primary' : ''}`}
                      onClick={() => choose(i, e.to)}
                    >
                      {node(r, e.to).name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {game.tutorial === 'route' && (
        <TutorialHint arrowX="85%">
          Tu Pokémon caminará solo y combatirá en cada parada. ¡Pulsa «¡En marcha!» y a partir de aquí juega a tu aire!
        </TutorialHint>
      )}
      <div className="row between">
        <RouteReward game={game} r={r} />
        <button
          className={`btn primary ${game.tutorial === 'route' ? 'tutorial-target' : ''}`}
          disabled={!canStart}
          onClick={() => act((s) => startRun(s, r.id, path))}
        >
          ¡En marcha!
        </button>
      </div>
    </div>
  )
}

/** Premio por completar la ruta; los tickets de primera vez solo se anuncian mientras no se haya completado */
function RouteReward({ game, r }: { game: GameState; r: Route }) {
  const { tickets, money, exp, firstClearTickets } = r.reward
  const parts = [`₽ ${money}`, `${exp} EXP`]
  if (tickets > 0) parts.push(`🎟 ${tickets}`)
  if (firstClearTickets && !game.completedRoutes.includes(r.id)) parts.push(`🎟 +${firstClearTickets} la primera vez`)
  return <span className="small muted">Premio: {parts.join(' · ')}</span>
}
