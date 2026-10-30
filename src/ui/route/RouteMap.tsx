import { useState } from 'react'
import { KANTO } from '../../data/maps'
import { signatureMove } from '../../data/moves'
import { species } from '../../data/species'
import { activeMon, TutorialStep, type GameState } from '../../game/core/state'
import { runBlocker } from '../../game/run/run'
import { TutorialHint } from '../shared/TutorialHint'
import { RoutePlanner } from './RoutePlanner'
import { RouteReward } from './RouteReward'

/** Mapa con las rutas: desbloqueadas, completadas y su premio; al abrir una se planifica el camino */
export function RouteMap({ game }: { game: GameState }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const blocker = runBlocker(game)
  const mon = activeMon(game)

  return (
    <div className="screen scroll">
      <h2 className="section-title">Mapa de {KANTO.name}</h2>
      {blocker && <p className="notice">{blocker}</p>}
      {mon && !blocker && (
        <p className="small muted">
          Sale {species(mon.speciesId).name}, que ataca con <strong>{signatureMove(mon.speciesId).name}</strong>.
        </p>
      )}
      <div className="route-list">
        {KANTO.routes.map((r) => {
          const unlocked = game.unlockedRoutes.includes(r.id)
          const done = game.completedRoutes.includes(r.id)
          const open = unlocked && openId === r.id
          // En el tutorial se guía hasta la primera ruta, que es la única desbloqueada
          const guided = game.tutorial === TutorialStep.Route && unlocked
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
