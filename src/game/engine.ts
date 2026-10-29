import { knownMoves, strongestMove } from '../data/moves'
import { markCaught } from './dex'
import { advanceExpeditions } from './expedition'
import { restInRanch } from './ranch'
import { advanceRun } from './run'
import type { GameState, OwnedMon } from './state'
import { calcStats } from './stats'

/** El progreso con la app cerrada se calcula hasta este máximo */
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000

const newUid = () => Math.random().toString(36).slice(2, 10)

export function createMon(speciesId: number, level: number): OwnedMon {
  return {
    uid: newUid(),
    speciesId,
    level,
    exp: 0,
    hp: calcStats(speciesId, level).hp,
    stars: 0,
    moveId: strongestMove(knownMoves(speciesId, level)),
    caughtAt: Date.now(),
  }
}

export function chooseStarter(s: GameState, speciesId: number) {
  const mon = createMon(speciesId, 5)
  s.owned.push(mon)
  s.activeUid = mon.uid
  markCaught(s, speciesId)
}

/** Avanza el juego hasta `now`: la ruta en curso, las expediciones y el descanso del rancho */
export function tick(s: GameState, now: number) {
  const dt = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS)
  s.lastTick = now
  const minutes = (dt / 60000) * s.timeScale

  if (s.run) advanceRun(s, dt)
  advanceExpeditions(s, minutes)
  restInRanch(s, minutes)
}
