import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { healCost, healInstant, setActive } from '../../../game/team/ranch'
import { maxHp } from '../../../game/team/stats'
import { ICON } from '../icons'
import { BigAction, MonSection } from './MonSheet'
import { TrainControl } from './TrainControl'

interface Props {
  game: GameState
  mon: OwnedMon
  /** Sesiones de entrenamiento elegidas sin aceptar: la cabecera las enseña en el arco de EXP */
  sessions: number
  onSessionsChange: (sessions: number) => void
}

/** Sección «Cuidados»: curar, entrenar y elegirlo como compañero; solo si está en el rancho (no en ruta ni fuera) */
export function CareSection({ game, mon, sessions, onSessionsChange }: Props) {
  const hpMax = maxHp(mon)
  const busy = monPlace(game, mon.uid) !== MonPlace.Ranch
  const isActive = mon.uid === game.activeUid

  return (
    <MonSection title="Cuidados">
      <BigAction icon={ICON.Heal} label="Curar" price={healCost(mon)} disabled={busy || mon.hp >= hpMax || game.money < healCost(mon)} onClick={() => act((s) => healInstant(s, mon.uid))} />
      <TrainControl game={game} mon={mon} sessions={sessions} onChange={onSessionsChange} />
      <BigAction
        icon={ICON.Active}
        label={isActive ? 'Es tu compañero de viaje' : 'Elegir como compañero de viaje'}
        disabled={busy || !!game.run || isActive}
        onClick={() => act((s) => setActive(s, mon.uid))}
      />
    </MonSection>
  )
}
