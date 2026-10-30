import type { Encounter } from '../../data/maps'

/** Fuente de azar inyectable: devuelve un número en [0, 1) como `Math.random` */
export type Rng = () => number

export const randInt = (min: number, max: number, rng: Rng): number => min + Math.floor(rng() * (max - min + 1))

/** Elige la especie de un encuentro según las probabilidades (en %) de la lista */
export function pickEncounter(pool: Encounter[], rng: Rng): number {
  let roll = rng() * pool.reduce((a, e) => a + e.chance, 0)
  for (const e of pool) {
    roll -= e.chance
    if (roll <= 0) return e.speciesId
  }
  return pool[pool.length - 1].speciesId
}
