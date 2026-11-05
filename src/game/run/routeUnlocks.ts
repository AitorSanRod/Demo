import { findRoute } from '../../data/maps'
import type { GameState } from '../core/state'

/**
 * Abre las rutas que desbloquean las ya completadas. Completar una ruta abre la siguiente (completeRoute), pero si la
 * siguiente se añade al mapa después, quien ya la había completado no vuelve a cobrar su premio: se abre al cargar
 */
export function unlockReachedRoutes(s: GameState) {
  for (const id of s.completedRoutes) {
    const next = findRoute(id)?.unlocks
    if (next && findRoute(next) && !s.unlockedRoutes.includes(next)) s.unlockedRoutes.push(next)
  }
}
