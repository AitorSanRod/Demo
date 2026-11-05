// Elemento de parada que se ve en la escena: aparece cuando faltan pocos pasos para llegar a la parada que lo tiene
// y sigue a la vista mientras el Pokémon está en ella (combatiendo o curándose) y al reanudar la marcha.

import { legSteps, node, route, type StopLandmark } from '../../data/maps'
import type { Run } from '../core/state'

/** Pasos que faltan para llegar a una parada cuando su elemento empieza a entrar en la escena */
export const LANDMARK_LEAD_STEPS = 2

export interface LandmarkInView {
  /** Índice en `path` de la parada a la que pertenece (para que la escena lo haga entrar una sola vez) */
  stop: number
  landmark: StopLandmark
}

const landmarkAt = (run: Run, stop: number): LandmarkInView | null => {
  const id = run.path[stop]
  const landmark = id === undefined ? undefined : node(route(run.routeId), id).landmark
  return landmark ? { stop, landmark } : null
}

/**
 * Elemento que tiene que estar en la escena: el de la parada siguiente si faltan `LANDMARK_LEAD_STEPS` pasos o
 * menos, o el de la parada en la que está (recién llegado o saliendo de ella). null si no toca ninguno.
 */
export function landmarkInView(run: Run): LandmarkInView | null {
  const next = run.stop + 1
  if (next < run.path.length) {
    const left = legSteps(route(run.routeId), run.path, next) - run.steps
    if (left <= LANDMARK_LEAD_STEPS) return landmarkAt(run, next)
  }
  return run.steps <= LANDMARK_LEAD_STEPS ? landmarkAt(run, run.stop) : null
}
