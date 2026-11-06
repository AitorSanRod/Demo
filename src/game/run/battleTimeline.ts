import type { BattleEvent, BattleRecord } from '../battle/battle'

// Cuánto se ve cada momento de un combate de ruta. El combate se resuelve entero al llegar a la parada y luego se
// reproduce en tiempo real (no le afecta `timeScale`); mientras dura, no se dan pasos.

/**
 * Milisegundos reales que dura en pantalla cada tipo de evento. El ataque es corto (el impulso hacia el rival) y el
 * golpe, que lleva el número y el efecto, se queda algo más; la aparición y la caída, lo justo para verlas.
 */
export const BATTLE_EVENT_MS: Record<BattleEvent['kind'], number> = {
  info: 900,
  attack: 450,
  hit: 650,
  miss: 650,
  faint: 800,
  status: 700,
  heal: 550,
}
/** Milisegundos reales tras el último evento (el rival cae o huye y se ve el premio) antes de seguir caminando */
export const BATTLE_END_MS = 1200

const eventsMs = (b: BattleRecord): number => b.events.reduce((sum, e) => sum + BATTLE_EVENT_MS[e.kind], 0)

export const battleDuration = (b: BattleRecord): number => eventsMs(b) + BATTLE_END_MS

export interface BattleMoment {
  /** Evento que se está viendo (el último cuando ya han pasado todos) */
  index: number
  /** Ya se vieron todos los eventos: queda la caída del rival y el premio */
  ended: boolean
  /** Milisegundos que faltan para el siguiente evento (o para el final del combate) */
  msToNext: number
}

/** Qué momento del combate toca según los milisegundos que le quedan */
export function battleMoment(b: BattleRecord, msLeft: number): BattleMoment {
  let elapsed = battleDuration(b) - msLeft
  for (let index = 0; index < b.events.length; index++) {
    const ms = BATTLE_EVENT_MS[b.events[index].kind]
    if (elapsed < ms) return { index, ended: false, msToNext: ms - elapsed }
    elapsed -= ms
  }
  return { index: b.events.length - 1, ended: true, msToNext: msLeft }
}
