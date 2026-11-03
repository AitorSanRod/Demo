import { useState } from 'react'
import type { Item } from '../../data/items'
import { RANCH_TYPES } from '../../data/ranchTypes'
import { species } from '../../data/species'
import { MonPlace, monPlace, type GameState } from '../../game/core/state'
import { placedRanchType, ranchPassives } from '../../game/team/ranchPassives'
import { RANCH_SLOTS, slotsOf, usedSlots } from '../../game/team/ranches'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { PassiveList } from './PassiveList'
import { RanchTypeSection } from './RanchTypeSection'
import './ranch-info.css'

const OUT_LABEL: Partial<Record<MonPlace, { icon: Item; text: string }>> = {
  [MonPlace.Run]: { icon: ICON.Route, text: 'En ruta' },
  [MonPlace.Expedition]: { icon: ICON.Expedition, text: 'De expedición' },
  [MonPlace.Raid]: { icon: ICON.Raid, text: 'Contra el jefe' },
}

/**
 * Botón del rancho (arriba a la izquierda) con sus espacios y cuántas pasivas da; al tocarlo sube el panel con el tipo
 * de rancho, las pasivas y quién está fuera guardando su hueco.
 */
export function RanchSlots({ game, ranch }: { game: GameState; ranch: number }) {
  const [open, setOpen] = useState(false)
  const away = game.owned.filter((m) => m.ranch === ranch && monPlace(game, m.uid) !== MonPlace.Ranch)
  const placed = placedRanchType(game, ranch)
  const passives = ranchPassives(game, ranch).length

  return (
    <>
      <div className="ranch-slots">
        <button className="ranch-slots-button small" onClick={() => setOpen(true)} aria-expanded={open}>
          <ItemIcon item={ICON.Ranch} size={22} /> {placed ? RANCH_TYPES[placed].name : `Rancho ${ranch + 1}`} ·{' '}
          <strong>{usedSlots(game, ranch)}</strong>/{RANCH_SLOTS}
          {passives > 0 && <span className="ranch-passive-count">{passives === 1 ? '1 pasiva' : `${passives} pasivas`}</span>}
        </button>
      </div>
      {open && (
        <div className="ranch-sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="ranch-sheet" role="dialog" aria-modal="true" aria-label={`Rancho ${ranch + 1}`} onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2 className="with-icon">
                <ItemIcon item={ICON.Ranch} size={32} /> Rancho {ranch + 1}
              </h2>
              <span className="small muted">
                {usedSlots(game, ranch)}/{RANCH_SLOTS} espacios
              </span>
            </div>
            <div className="label">Tipo de rancho</div>
            <RanchTypeSection game={game} ranch={ranch} />
            <div className="label">Pasivas para el Pokémon que sale de ruta</div>
            <PassiveList game={game} ranch={ranch} />
            {away.length > 0 && <div className="label">Fuera, guardando su hueco</div>}
            {away.map((m) => (
              <div key={m.uid} className="row gap small">
                <Sprite id={m.speciesId} size={32} animated={false} />
                <span className="grow">{species(m.speciesId).name}</span>
                <span className="tiny muted with-icon">
                  <ItemIcon item={OUT_LABEL[monPlace(game, m.uid)]!.icon} size={16} /> {OUT_LABEL[monPlace(game, m.uid)]!.text} ·{' '}
                  {slotsOf(m.speciesId)} esp.
                </span>
              </div>
            ))}
            <button className="btn primary wide" onClick={() => setOpen(false)}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
