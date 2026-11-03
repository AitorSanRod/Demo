import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { maxTrainSessions, train, trainCost, trainPlan } from '../../../game/team/ranch'
import { ICON } from '../icons'
import { StepperAction } from './StepperAction'

interface Props {
  game: GameState
  mon: OwnedMon
  /** Sesiones elegidas sin aceptar (0: ninguna); la ficha las enseña en el arco de EXP */
  sessions: number
  onChange: (sessions: number) => void
}

/** Entrenar sin salir de la ficha: el arco de arriba enseña dónde quedará con las sesiones elegidas */
export function TrainControl({ game, mon, sessions, onChange }: Props) {
  return (
    <StepperAction
      icon={ICON.Train}
      label={(n) => (n > 0 ? `Entrenar ×${n}` : 'Entrenar')}
      price={(n) => (n > 0 ? trainPlan(mon, n).cost : trainCost(mon))}
      count={sessions}
      max={maxTrainSessions(game, mon.uid)}
      onChange={onChange}
      onAccept={() => {
        act((s) => train(s, mon.uid, sessions))
        onChange(0)
      }}
    />
  )
}
