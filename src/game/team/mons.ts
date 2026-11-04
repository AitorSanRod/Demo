import type { OwnedMon } from '../core/state'
import { calcStats } from './stats'

/** Nivel con el que llega cualquier Pokémon nuevo al equipo (piezas, evolución o inicial) */
export const NEW_MON_LEVEL = 5
/** Rancho con el que empieza la partida */
const FIRST_RANCH = 0

/** Identificador único del Pokémon dentro de la partida (no afecta al juego, por eso no usa el rng inyectable) */
const newUid = () => Math.random().toString(36).slice(2, 10)

/** Un Pokémon nuevo del equipo, con los PS al máximo */
export function createMon(speciesId: number, level: number, ranch: number | null = FIRST_RANCH): OwnedMon {
  return { uid: newUid(), speciesId, level, exp: 0, hp: calcStats(speciesId, level).hp, stars: 0, ranch, spot: null }
}
