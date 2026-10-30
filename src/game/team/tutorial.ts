import { STARTERS } from '../../data/species'
import { markSeen } from '../collection/dex'
import { addPieces, PIECES_PER_COMBINE, piecesOf } from '../collection/pieces'
import { TutorialStep, type GameState } from '../core/state'

/** Piezas del inicial elegido en el tutorial: justas para combinarlo nada más llegar a la Pokédex */
export const STARTER_PIECES = PIECES_PER_COMBINE

/**
 * Pasos del tutorial: elegir inicial → combinar sus piezas en la Pokédex → salir a la primera ruta.
 * `combine` avanza a 'route' al desbloquear un Pokémon y `startRun` lo termina (ver pieces.ts y run.ts).
 */
export function pickStarter(s: GameState, speciesId: number) {
  if (s.tutorial !== TutorialStep.Starter || !STARTERS.includes(speciesId)) return
  // El inicial es la excepción a verlo en ruta: hay que poder combinarlo para empezar a jugar
  markSeen(s, speciesId)
  addPieces(s, speciesId, STARTER_PIECES)
  s.tutorial = TutorialStep.Combine
}

/** Inicial elegido mientras sus piezas siguen sin combinar */
export const tutorialStarter = (s: GameState): number | undefined => STARTERS.find((id) => piecesOf(s, id) > 0)
