import { markCaught } from '../collection/dex'
import { createMon } from '../team/mons'
import type { Rng } from './random'
import type { GameState } from './state'

/** Rng determinista que devuelve los valores dados en bucle */
export function seqRng(...values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

/** Da el inicial directamente (Nv. 5, activo) y salta el tutorial */
export function chooseStarter(s: GameState, speciesId: number) {
  const mon = createMon(speciesId, 5)
  s.owned.push(mon)
  s.activeUid = mon.uid
  s.tutorial = null
  markCaught(s, speciesId)
}
