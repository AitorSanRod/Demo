import { route } from '../../data/maps'
import { species } from '../../data/species'
import { isExpeditionDone } from '../team/expedition'
import { PushTopic, type PushJob } from './push'
import { activeMon, findMon, type GameState } from './state'
import { MAX_OFFLINE_MS, tick } from './tick'

// Los avisos que programa el móvil (solo él sabe cuándo acaban): la vuelta de cada expedición y el final de la ruta en
// curso. El servidor los manda aunque la app esté cerrada (ver net/push.ts y worker/push).

/** Milisegundos reales por paso al simular la ruta hacia delante (más grande: menos cálculo y menos precisión) */
const RUN_PREDICT_STEP_MS = 60_000
/** Clave del aviso de la ruta (solo hay una a la vez) */
const RUN_KEY = 'run'

/** Cada expedición en curso avisa cuando vuelve (su hora se sabe exacta) */
function expeditionJobs(s: GameState, now: number): PushJob[] {
  return s.expeditions
    .filter((e) => !isExpeditionDone(e))
    .flatMap((e) => {
      const mon = findMon(s, e.uid)
      if (!mon) return []
      const dueAt = now + ((e.durationMin - e.elapsedMin) * 60_000) / s.timeScale
      const name = species(mon.speciesId).name
      return [{ topic: PushTopic.Expedition, key: e.uid, dueAt, title: `¡${name} ha vuelto!`, body: `Ha terminado su expedición por ${route(e.routeId).name}. Toca para recoger el premio.` }]
    })
}

/** Cómo acaba la ruta según la simulación: completada, debilitado o en la parada del jefe comunitario */
export type RunEnd = { at: number; phase: 'complete' | 'fainted' | 'raid' }

/**
 * Simula la partida hacia delante sobre una copia (como si la app estuviera cerrada) hasta que la ruta deja de andar;
 * null si no hay ruta andando o no acaba dentro de lo que se pone al día con la app cerrada. Es una estimación: los
 * combates salen al azar
 */
export function predictRunEnd(s: GameState, now: number): RunEnd | null {
  if (s.run?.phase !== 'walking') return null
  const copy = structuredClone(s)
  copy.lastTick = now
  for (let t = now + RUN_PREDICT_STEP_MS; t <= now + MAX_OFFLINE_MS; t += RUN_PREDICT_STEP_MS) {
    tick(copy, t)
    const phase = copy.run?.phase
    if (phase && phase !== 'walking') return { at: t, phase }
  }
  return null
}

const RUN_TEXT: Record<RunEnd['phase'], (name: string, where: string) => { title: string; body: string }> = {
  complete: (name, where) => ({ title: '¡Ruta completada!', body: `${name} ha terminado ${where}. Toca para ver lo que ha ganado.` }),
  fainted: (name, where) => ({ title: `${name} se ha debilitado`, body: `En ${where}. Ha vuelto al rancho a descansar.` }),
  raid: (name, where) => ({ title: `${name} ha llegado al jefe de ${where}`, body: 'Se ha unido a la pelea contra el jefe comunitario.' }),
}

function runJobs(s: GameState, now: number): PushJob[] {
  const end = predictRunEnd(s, now)
  const mon = activeMon(s)
  if (!end || !mon || !s.run) return []
  const text = RUN_TEXT[end.phase](species(mon.speciesId).name, route(s.run.routeId).name)
  return [{ topic: PushTopic.Run, key: RUN_KEY, dueAt: end.at, ...text }]
}

/** Los avisos que el móvil le pide al servidor ahora mismo */
export const clientPushPlan = (s: GameState, now: number): PushJob[] => [...expeditionJobs(s, now), ...runJobs(s, now)]
