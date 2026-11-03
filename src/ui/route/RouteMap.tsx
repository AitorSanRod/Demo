import { Fragment, useState } from 'react'
import { KANTO, type Route } from '../../data/maps'
import { activeMon, TutorialStep, type GameState } from '../../game/core/state'
import { runBlocker } from '../../game/run/run'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { TutorialHint } from '../shared/TutorialHint'
import { RouteRaidMark } from './RouteRaidMark'
import { RouteStartDialog } from './RouteStartDialog'

/**
 * Lista de rutas, una por línea: nombre, niveles, si está completada y «Comenzar» (o un candado si sigue bloqueada),
 * sobre la imagen de su zona difuminada.
 */
export function RouteMap({ game }: { game: GameState }) {
  const [starting, setStarting] = useState<Route | null>(null)
  const blocker = runBlocker(game)
  const mon = activeMon(game)
  const [report, setReport] = useState<RewardItem[] | null>(null)

  return (
    <div className="screen scroll">
      {report && <RewardOverlay title="¡Premio del jefe!" items={report} onClose={() => setReport(null)} />}
      <h2 className="section-title">Mapa de {KANTO.name}</h2>
      {blocker && <p className="notice">{blocker}</p>}
      <div className="route-list">
        {KANTO.routes.map((r) => {
          const unlocked = game.unlockedRoutes.includes(r.id)
          const done = game.completedRoutes.includes(r.id)
          // En el tutorial se guía hasta la primera ruta, que es la única desbloqueada
          const guided = game.tutorial === TutorialStep.Route && unlocked && !starting
          return (
            <Fragment key={r.id}>
              {/* El bocadillo señala hacia abajo: va encima de la línea, apuntando a «Comenzar» */}
              {guided && <TutorialHint arrowX="88%">Toca «Comenzar» para salir a tu primera ruta.</TutorialHint>}
              <div className={`card route-row ${unlocked ? '' : 'locked'}`}>
                {r.backdrop && (
                  <span
                    className="route-backdrop"
                    style={{ backgroundImage: `url(${r.backdrop.image})`, backgroundPositionY: `${r.backdrop.focusY}%` }}
                    aria-hidden="true"
                  />
                )}
                <strong className="grow">{r.name}</strong>
                <RouteRaidMark game={game} routeId={r.id} onCollect={setReport} />
                <span className="small route-levels">
                  Nv. {r.levels[0]}–{r.levels[1]}
                </span>
                {done && (
                  <span className="route-done" title="Completada" aria-label="Completada">
                    ✓
                  </span>
                )}
                {unlocked ? (
                  <button className={`btn primary small ${guided ? 'tutorial-target' : ''}`} disabled={!!blocker} onClick={() => setStarting(r)}>
                    Comenzar
                  </button>
                ) : (
                  <span className="route-lock" aria-label="Bloqueada: completa la ruta anterior" title="Completa la ruta anterior">
                    <ItemIcon item={ICON.Locked} size={32} />
                  </span>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
      <p className="tiny muted">Si te derrotan en una ruta, pierdes la mitad del dinero ganado en ella.</p>
      {starting && mon && <RouteStartDialog game={game} route={starting} mon={mon} onClose={() => setStarting(null)} />}
    </div>
  )
}
