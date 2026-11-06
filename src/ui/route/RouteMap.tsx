import { Fragment, useState } from 'react'
import { KANTO, type Route } from '../../data/maps'
import { activeMon, TutorialStep, type GameState } from '../../game/core/state'
import { runBlocker } from '../../game/run/run'
import { TutorialHint } from '../shared/TutorialHint'
import { RouteLock, RouteRow, RouteRowTitle } from './RouteRow'
import { RouteStartDialog } from './RouteStartDialog'

/**
 * Lista de rutas, una por línea: nombre, niveles y si está completada, sobre la imagen de su zona difuminada. Toda la
 * línea es el botón de comenzarla (con un candado si sigue bloqueada).
 */
export function RouteMap({ game }: { game: GameState }) {
  const [starting, setStarting] = useState<Route | null>(null)
  const blocker = runBlocker(game)
  const mon = activeMon(game)

  return (
    <div className="screen scroll">
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
              {/* El bocadillo señala hacia abajo: va encima de la línea, apuntando a ella */}
              {guided && <TutorialHint arrowX="50%">Toca la ruta para salir por primera vez.</TutorialHint>}
              <RouteRow
                route={r}
                locked={!unlocked}
                className={guided ? 'tutorial-target' : ''}
                disabled={!!blocker}
                onClick={() => setStarting(r)}
              >
                <RouteRowTitle route={r} />
                {done && (
                  <span className="route-done" title="Completada" aria-label="Completada">
                    ✓
                  </span>
                )}
                {!unlocked && <RouteLock />}
              </RouteRow>
            </Fragment>
          )
        })}
      </div>
      <p className="tiny muted">Si te derrotan en una ruta, pierdes la mitad del dinero ganado en ella.</p>
      {starting && mon && <RouteStartDialog game={game} route={starting} mon={mon} onClose={() => setStarting(null)} />}
    </div>
  )
}
