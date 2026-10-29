import { useState } from 'react'
import { KANTO, node, pathFrom, type Route } from '../data/maps'
import { move } from '../data/moves'
import { species } from '../data/species'
import { runBlocker, startRun } from '../game/run'
import { activeMon, type GameState } from '../game/state'
import { act } from '../game/store'
import { Sprite } from './common'
import { RunView } from './RunView'

export function RouteScreen({ game }: { game: GameState }) {
  const mon = activeMon(game)
  if (!game.run || !mon) return <RouteSelect game={game} />
  return <RunView game={game} run={game.run} mon={mon} />
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
          return (
            <div key={r.id} className={`card route-card ${unlocked ? '' : 'locked'}`}>
              <div className="route-card-head">
                <strong>{r.name}</strong>
                <span className="muted">Nv. {r.levels[0]}–{r.levels[1]}</span>
                {done && <span className="tag ok">Completada</span>}
              </div>
              <p className="muted small">{unlocked ? r.description : 'Completa la ruta anterior para desbloquearla.'}</p>
              {unlocked && !open && (
                <div className="row between">
                  <span className="small muted">
                    Premio: 🎟 {r.reward.tickets} · ₽ {r.reward.money}
                  </span>
                  <button className="btn" onClick={() => setOpenId(r.id)}>
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
      <div className="row between">
        <span className="small muted">
          Premio: 🎟 {r.reward.tickets} · ₽ {r.reward.money}
        </span>
        <button className="btn primary" disabled={!canStart} onClick={() => act((s) => startRun(s, r.id, path))}>
          ¡En marcha!
        </button>
      </div>
    </div>
  )
}
