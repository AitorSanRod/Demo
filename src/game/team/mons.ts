import type { OwnedMon } from '../core/state'
import { calcStats } from './stats'

/** Identificador único del Pokémon dentro de la partida (no afecta al juego, por eso no usa el rng inyectable) */
const newUid = () => Math.random().toString(36).slice(2, 10)

/** Un Pokémon nuevo del equipo, con los PS al máximo */
export function createMon(speciesId: number, level: number): OwnedMon {
  return { uid: newUid(), speciesId, level, exp: 0, hp: calcStats(speciesId, level).hp, stars: 0 }
}
