import { advanceRun } from '../run/run'
import { advanceExpeditions } from '../team/expedition'
import { restInRanch } from '../team/ranch'
import type { GameState } from './state'

/** El progreso con la app cerrada se calcula hasta este máximo */
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000

/** Avanza el juego hasta `now`: la ruta en curso, las expediciones y el descanso del rancho */
export function tick(s: GameState, now: number) {
  const dt = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS)
  s.lastTick = now
  const minutes = (dt / 60000) * s.timeScale

  if (s.run) advanceRun(s, dt)
  advanceExpeditions(s, minutes)
  restInRanch(s, minutes)
}
