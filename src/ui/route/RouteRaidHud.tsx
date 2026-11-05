import { useState } from 'react'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { isSearching } from '../../game/raid/raidEngine'
import { raidMinutesLeft } from '../../game/raid/raidEstimate'
import { presentMembers, RAID_ROOM_SIZE, type Raid } from '../../game/raid/raidRoom'
import { retreatRouteRaid } from '../../game/raid/routeRaid'
import { useWatchRaid } from '../../net/raidSync'
import { RaidLinkNote } from '../raid/RaidLinkNote'
import { RaidRoster } from '../raid/RaidRoster'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatMinutes } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/**
 * Línea del marcador de la ruta durante la pelea de la parada: el jefe, cuántos hay en la sala y cuánto le queda.
 * Tocar el contador abre o cierra la lista de la sala debajo
 */
export function RaidHudLine({ game, raid }: { game: GameState; raid: Raid }) {
  const [rosterOpen, setRosterOpen] = useState(false)
  if (isSearching(raid)) return <RaidLinkNote raid={raid} />
  const minutesLeft = raidMinutesLeft(game, raid)
  return (
    <>
      <div className="row between small">
        <button className="raid-hud-count with-icon" aria-expanded={rosterOpen} onClick={() => setRosterOpen(!rosterOpen)}>
          <ItemIcon item={ICON.Raid} size={18} /> <strong>{species(raid.boss.speciesId).name}</strong> · {presentMembers(raid).length}/
          {RAID_ROOM_SIZE} {rosterOpen ? '▴' : '▾'}
        </button>
        <span>{minutesLeft === null ? 'Nadie le hace daño' : `Caerá en ≈ ${formatMinutes(minutesLeft / game.timeScale)}`}</span>
      </div>
      {rosterOpen && (
        <div className="raid-hud-roster">
          <RaidRoster raid={raid} timeScale={game.timeScale} />
        </div>
      )}
      <RaidLinkNote raid={raid} />
    </>
  )
}

/**
 * Mientras se busca sala en el servidor (antes de una con bots se mira si hay una con jugadores): el Pokémon espera
 * en la parada con el jefe de fondo; se consulta enseguida, como con la pelea en pantalla
 */
export function RaidSearching({ raid }: { raid: Raid }) {
  useWatchRaid()
  return (
    <div className="raid-searching">
      <ItemIcon item={ICON.Raid} size={32} />
      <span>Buscando entrenadores para luchar contra {species(raid.boss.speciesId).name}…</span>
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
