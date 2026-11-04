import { useState } from 'react'
import { species } from '../../../data/species'
import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { healCost, healInstant } from '../../../game/team/ranch'
import { maxHp } from '../../../game/team/stats'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { ItemIcon } from '../ItemIcon'

/** Poción de la esquina inferior izquierda de la cabecera: pregunta el precio y, al aceptar, cura todos sus PS */
export function HealButton({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [asking, setAsking] = useState(false)
  const cost = healCost(mon)
  const hpMax = maxHp(mon)
  const blocker =
    monPlace(game, mon.uid) !== MonPlace.Ranch
      ? 'Solo se puede curar en el rancho'
      : mon.hp >= hpMax
        ? 'Tiene todos sus PS'
        : game.money < cost
          ? `Curar cuesta ₽ ${cost} y no tienes suficiente`
          : null
  const hint = blocker ?? `Curar por ₽ ${cost}`
  const name = species(mon.speciesId).name

  return (
    <>
      <button className="heal-button" disabled={!!blocker} aria-label={hint} title={hint} onClick={() => setAsking(true)}>
        <ItemIcon item={ICON.Heal} size={34} />
      </button>
      {asking && (
        <ConfirmDialog
          title={`¿Curar a ${name}?`}
          confirmLabel={`Curar por ₽ ${cost}`}
          onConfirm={() => {
            act((s) => healInstant(s, mon.uid))
            setAsking(false)
          }}
          onCancel={() => setAsking(false)}
        >
          <p className="small">
            Recupera todos sus PS ({Math.floor(mon.hp)} / {hpMax}) por <strong>₽ {cost}</strong>. Tienes ₽ {game.money}.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
