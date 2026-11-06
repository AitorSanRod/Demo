import type { Raid } from '../../game/raid/raidRoom'
import { formatMinutes } from '../shared/format'

/** Cuándo caerá el jefe (en minutos de juego, null si nadie le hace daño); si ya ha caído, se dice */
export function fallText(raid: Raid, gameMinutesLeft: number | null, timeScale: number): string {
  if (raid.hp === 0) return '¡Derrotado!'
  if (gameMinutesLeft === null) return 'Nadie le hace daño'
  return `Caerá en ≈ ${formatMinutes(gameMinutesLeft / timeScale)}`
}
