import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { setActive } from '../../../game/team/ranch'

/** Poké Ball de la esquina izquierda de la cabecera: vacía si no es el compañero de viaje y llena si lo es; tocarla lo elige */
export function CompanionButton({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const isActive = mon.uid === game.activeUid
  const canChoose = !isActive && !game.run && monPlace(game, mon.uid) === MonPlace.Ranch
  const hint = isActive ? 'Es tu compañero de viaje' : canChoose ? 'Elegir como compañero de viaje' : 'Solo se puede elegir desde el rancho y sin ruta en curso'
  return (
    <button
      className={`companion-button ${isActive ? 'on' : ''}`}
      aria-pressed={isActive}
      aria-label={hint}
      title={hint}
      disabled={!canChoose}
      onClick={() => act((s) => setActive(s, mon.uid))}
    >
      <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden="true">
        <path className="ball-top" d="M2.5 12a9.5 9.5 0 0 1 19 0z" />
        <path className="ball-bottom" d="M2.5 12a9.5 9.5 0 0 0 19 0z" />
        <circle className="ball-button" cx="12" cy="12" r="3.2" />
      </svg>
    </button>
  )
}
