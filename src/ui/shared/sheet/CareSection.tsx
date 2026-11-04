import type { GameState, OwnedMon } from '../../../game/core/state'
import { MonSection } from './MonSheet'
import { TrainControl } from './TrainControl'

interface Props {
  game: GameState
  mon: OwnedMon
  /** Sesiones de entrenamiento elegidas sin aceptar: la cabecera las enseña en el arco de EXP */
  sessions: number
  onSessionsChange: (sessions: number) => void
}

/** Sección «Cuidados»: entrenar (solo si está en el rancho); curar es la poción de la cabecera (HealButton) */
export function CareSection({ game, mon, sessions, onSessionsChange }: Props) {
  return (
    <MonSection title="Cuidados">
      <TrainControl game={game} mon={mon} sessions={sessions} onChange={onSessionsChange} />
    </MonSection>
  )
}
