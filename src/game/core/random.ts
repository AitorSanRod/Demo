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

/** Rng determinista a partir de una semilla (mulberry32): da siempre la misma secuencia, p. ej. para estimaciones estables */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
