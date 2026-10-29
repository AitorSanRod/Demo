import { STARTERS } from '../data/species'
import { addPieces, piecesOf } from './dex'
import type { GameState } from './state'

/**
 * Piezas del inicial elegido en el tutorial. Igual a PIECES_PER_COMBINE (pieces.ts) para que se pueda combinar
 * nada más llegar a la Pokédex; no se importa de allí para no crear un ciclo de imports.
 */
export const STARTER_PIECES = 5

/**
 * Pasos del tutorial: elegir inicial → combinar sus piezas en la Pokédex → salir a la primera ruta.
 * `combine` avanza a 'route' al desbloquear un Pokémon y `startRun` lo termina (ver pieces.ts y run.ts).
 */
export function pickStarter(s: GameState, speciesId: number) {
  if (s.tutorial !== 'starter' || !STARTERS.includes(speciesId)) return
  addPieces(s, speciesId, STARTER_PIECES)
  s.tutorial = 'combine'
}

/** Inicial elegido mientras sus piezas siguen sin combinar */
export const tutorialStarter = (s: GameState): number | undefined => STARTERS.find((id) => piecesOf(s, id) > 0)
