import { rarityOf, SPECIES, type Rarity } from '../../data/species'
import { markCaught } from '../collection/dex'
import { createMon } from '../team/mons'
import type { Rng } from './random'
import type { GameState } from './state'

/** Rng determinista que devuelve los valores dados en bucle */
export function seqRng(...values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

/** Una especie de esa rareza (la `index`-ésima), sin depender de cuál sea hoy */
export function speciesOfRarity(rarity: Rarity, index = 0): number {
  return SPECIES.filter((sp) => rarityOf(sp) === rarity)[index].id
}

/** Da el inicial directamente (Nv. 5, activo) y salta el tutorial */
export function chooseStarter(s: GameState, speciesId: number) {
  const mon = createMon(speciesId, 5)
  s.owned.push(mon)
  s.activeUid = mon.uid
  s.tutorial = null
  markCaught(s, speciesId)
}
