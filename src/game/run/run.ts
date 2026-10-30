import { isValidPath, legSteps, node, pathFrom, route, type Route } from '../../data/maps'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { activeMon, monPlace, type GameState } from '../core/state'
import { stepsPerMinute } from '../team/stats'
import { BATTLE_EVENT_MS, completeRoute, spendBattleTime, startWildBattle } from './runBattle'

export function runBlocker(s: GameState): string | null {
  const mon = activeMon(s)
  if (!mon) return 'No tienes Pokémon activo.'
  if (s.run) return 'Ya hay una ruta en curso.'
  const name = species(mon.speciesId).name
  if (monPlace(s, mon.uid) === 'expedition') return `${name} está de expedición.`
  if (mon.hp < 1) return `${name} está debilitado. Déjalo descansar o cúralo en el rancho.`
  return null
}

/** Sale a la ruta con el camino ya elegido; a partir de aquí todo es automático */
export function startRun(s: GameState, routeId: string, path = pathFrom(route(routeId))) {
  if (runBlocker(s) || !s.unlockedRoutes.includes(routeId) || !isValidPath(route(routeId), path)) return
  if (s.tutorial === 'route') s.tutorial = null
  s.run = {
    routeId,
    path,
    stop: 0,
    steps: 0,
    phase: 'walking',
    lastBattle: null,
    battleMsLeft: 0,
    earned: { money: 0, tickets: 0, pieces: [], exp: 0, levelsGained: 0, wins: 0, battles: 0 },
  }
}

/**
 * Avanza la ruta `realMs` milisegundos reales. Durante un combate el tiempo se gasta en él y no se dan pasos;
 * fuera de combate se camina según la velocidad del Pokémon y `timeScale`. Puede cruzar varias paradas y
 * combates de una vez, p. ej. al volver tras un rato.
 */
export function advanceRun(s: GameState, realMs: number, rng: Rng = Math.random) {
  const run = s.run
  let left = realMs
  while (run && left > 0) {
    if (run.battleMsLeft > 0) {
      left -= spendBattleTime(s, route(run.routeId), left)
      continue
    }
    if (run.phase !== 'walking') return
    const stepsPerMs = (stepsPerMinute(activeMon(s)!) * s.timeScale) / 60000
    const steps = left * stepsPerMs
    const used = walk(s, steps, rng)
    if (used >= steps) return
    left -= used / stepsPerMs
  }
}

/** Camina hasta la siguiente parada como mucho (allí combate). Devuelve los pasos usados; 0 si hay combate. */
export function walk(s: GameState, steps: number, rng: Rng = Math.random): number {
  const run = s.run
  if (!run || run.phase !== 'walking' || run.battleMsLeft > 0) return 0
  const r = route(run.routeId)
  const needed = legSteps(r, run.path, run.stop + 1) - run.steps
  if (steps < needed) {
    run.steps += steps
    return steps
  }
  arrive(s, r, rng)
  return needed
}

/** Tocar la escena: fuera de combate da un paso; en combate lo adelanta un evento */
export function tapRun(s: GameState) {
  const run = s.run
  if (!run) return
  if (run.battleMsLeft > 0) spendBattleTime(s, route(run.routeId), BATTLE_EVENT_MS)
  else walk(s, 1)
}

function arrive(s: GameState, r: Route, rng: Rng) {
  const run = s.run!
  run.stop++
  run.steps = 0
  const n = node(r, run.path[run.stop])
  // Con combate, el final de la ruta se decide al acabar el combate (ver runBattle.ts)
  if (n.kind === 'wild') startWildBattle(s, r, n, rng)
  else if (run.stop === run.path.length - 1) completeRoute(s, r)
}

/** Volver al rancho: al terminar la ruta o abandonándola (se conserva lo ganado) */
export function endRun(s: GameState) {
  s.run = null
}
