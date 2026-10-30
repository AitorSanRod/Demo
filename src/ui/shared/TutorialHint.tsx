import type { CSSProperties, ReactNode } from 'react'
import { species } from '../../data/species'
import { activeMon, TutorialStep, type GameState } from '../../game/core/state'
import { STARTER_PIECES, tutorialStarter } from '../../game/team/tutorial'
import './tutorial.css'

/** Bocadillo flotante del tutorial que señala hacia abajo lo siguiente que hay que tocar; no bloquea los toques */
export function TutorialHint({ children, arrowX = '50%' }: { children: ReactNode; arrowX?: string }) {
  return (
    <div className="tutorial-hint" role="status" style={{ ['--arrow-x' as string]: arrowX } as CSSProperties}>
      {children}
    </div>
  )
}

const NAV_STEPS: Record<Exclude<TutorialStep, typeof TutorialStep.Starter>, { tab: string; text: (name: string) => string }> = {
  [TutorialStep.Combine]: { tab: 'dex', text: (name) => `Tus ${STARTER_PIECES} piezas de ${name} están en la Pokédex. ¡Ábrela!` },
  [TutorialStep.Route]: { tab: 'route', text: (name) => `¡${name} ya es tu compañero! Ve a Ruta para salir por primera vez.` },
}

/** Mientras dura el tutorial, señala la pestaña del menú inferior a la que hay que ir (si no se está ya en ella) */
export function TutorialNavHint({ game, currentTab, tabIds }: { game: GameState; currentTab: string; tabIds: string[] }) {
  if (game.tutorial !== TutorialStep.Combine && game.tutorial !== TutorialStep.Route) return null
  const step = NAV_STEPS[game.tutorial]
  if (currentTab === step.tab) return null
  const speciesId = game.tutorial === TutorialStep.Combine ? tutorialStarter(game) : activeMon(game)?.speciesId
  if (!speciesId) return null
  const index = tabIds.indexOf(step.tab)
  return (
    <div className="tutorial-nav">
      <TutorialHint arrowX={`${((index + 0.5) / tabIds.length) * 100}%`}>{step.text(species(speciesId).name)}</TutorialHint>
    </div>
  )
}
