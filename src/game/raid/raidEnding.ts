import { RAID_ROUND_MS } from './raidCombat'
import type { Raid } from './raidRoom'

// El final de la pelea contra un jefe comunitario. Cuando la pelea se para (cae el jefe o un Pokémon del jugador gasta
// sus vidas), la sala no se cierra en el acto: primero se ve entera la última ronda (sus golpes se reparten a lo largo
// de RAID_ROUND_MS, ver ui/raid/roundReplay.ts) y luego un momento de cierre; solo entonces se aplica el resultado.

/** Milisegundos de juego del cierre, tras la última ronda: el jefe cae (o el tuyo) y se lee el cartel */
export const RAID_FINALE_MS = 3_000
/** Milisegundos de juego que dura el final entero: la última ronda y el cierre */
export const RAID_ENDING_MS = RAID_ROUND_MS + RAID_FINALE_MS

/** La pelea se ha parado y se está viendo su final (las salas del servidor no lo marcan nunca) */
export const isEnding = (raid: Raid): boolean => raid.endingMs > 0

/** Ya se ha visto la última ronda: queda el cierre */
export const inFinale = (raid: Raid): boolean => isEnding(raid) && raid.endingMs <= RAID_FINALE_MS

/** Empieza el final: la última ronda se vuelve a ver desde el principio, aunque una parte ya hubiera pasado */
export function beginEnding(raid: Raid) {
  if (isEnding(raid)) return
  raid.endingMs = RAID_ENDING_MS
  raid.roundMsLeft = RAID_ROUND_MS
}

/**
 * Gasta hasta `ms` del final (el reloj de la ronda corre con él, para que la UI reparta sus golpes). Devuelve los
 * milisegundos que sobran si el final ha terminado; null si sigue
 */
export function spendEnding(raid: Raid, ms: number): number | null {
  const spent = Math.min(ms, raid.endingMs)
  raid.endingMs -= spent
  raid.roundMsLeft = Math.max(0, raid.roundMsLeft - spent)
  return raid.endingMs === 0 ? ms - spent : null
}
