import { useState } from 'react'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { raidMinutesLeft } from '../../game/raid/raidEstimate'
import { presentMembers, RAID_ROOM_SIZE, type Raid } from '../../game/raid/raidRoom'
import { retreatRouteRaid } from '../../game/raid/routeRaid'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatMinutes } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Línea del marcador de la ruta durante la pelea de la parada: el jefe, cuántos hay en la sala y cuánto le queda */
export function RaidHudLine({ game, raid }: { game: GameState; raid: Raid }) {
  const minutesLeft = raidMinutesLeft(game, raid)
  return (
    <div className="row between small">
      <span className="with-icon">
        <ItemIcon item={ICON.Raid} size={18} /> <strong>{species(raid.boss.speciesId).name}</strong> · {presentMembers(raid).length}/
        {RAID_ROOM_SIZE}
      </span>
      <span>{minutesLeft === null ? 'Nadie le hace daño' : `Caerá en ≈ ${formatMinutes(minutesLeft / game.timeScale)}`}</span>
    </div>
  )
}

/** Retirarse de la pelea de la parada pide confirmación: cuenta como una derrota */
export function RetreatButton() {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <button className="btn ghost small hud-abandon" onClick={() => setConfirming(true)}>
        Retirarse
      </button>
      {confirming && (
        <ConfirmDialog
          title="¿Retirarse de la pelea?"
          confirmLabel="Retirarse"
          cancelLabel="Seguir luchando"
          onConfirm={() => {
            act(retreatRouteRaid)
            setConfirming(false)
          }}
          onCancel={() => setConfirming(false)}
        >
          <p className="small confirm-text">
            Cuenta como una derrota: la ruta acaba sin completarse, sin el premio del jefe, y pierdes la mitad del dinero
            ganado en ella.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
