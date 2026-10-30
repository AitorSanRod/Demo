import { useState } from 'react'
import { node, pathFrom, type Route } from '../../data/maps'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { startRun } from '../../game/run/run'
import { Sprite } from '../shared/common'
import { TutorialHint } from '../shared/TutorialHint'
import { RouteReward } from './RouteReward'

/** Todo se decide aquí, antes de salir: en las bifurcaciones se elige rama y el resto del camino se rehace */
export function RoutePlanner({ game, route: r, canStart }: { game: GameState; route: Route; canStart: boolean }) {
  const [path, setPath] = useState(() => pathFrom(r))
  const choose = (i: number, to: string) => setPath([...path.slice(0, i + 1), ...pathFrom(r, to)])

  return (
    <div className="planner">
      <ol className="stop-list">
        {path.map((id, i) => {
          const n = node(r, id)
          const pool = [...new Set((n.encounters ?? r.encounters).map((e) => e.speciesId))]
          return (
            <li key={id} className={`stop ${n.boss ? 'boss' : ''}`}>
              <div className="row between">
                <strong className="small">{n.name}</strong>
                {n.boss ? (
                  <span className="tag boss-tag">Jefe · Nv. {n.boss.level}</span>
                ) : (
                  <span className="tiny muted">{n.levelBonus ? `Nv. +${n.levelBonus}` : ''}</span>
                )}
              </div>
              {n.boss && (
                <span className="row gap">
                  <Sprite id={n.boss.speciesId} size={48} animated={false} silhouette={!game.seen.includes(n.boss.speciesId)} />
                  <span className="tiny muted">Te espera al final. Pega más fuerte que un salvaje, pero da más premio.</span>
                </span>
              )}
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
