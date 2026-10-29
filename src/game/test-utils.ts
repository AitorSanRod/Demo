import type { Rng } from './random'

/** Rng determinista que devuelve los valores dados en bucle */
export function seqRng(...values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}
