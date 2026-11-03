import { useState } from 'react'
import type { Item } from '../../data/items'
import { species } from '../../data/species'
import { MonPlace, monPlace, type GameState } from '../../game/core/state'
import { RANCH_SLOTS, slotsOf, usedSlots } from '../../game/team/ranches'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

const OUT_LABEL: Partial<Record<MonPlace, { icon: Item; text: string }>> = {
  [MonPlace.Run]: { icon: ICON.Route, text: 'En ruta' },
  [MonPlace.Expedition]: { icon: ICON.Expedition, text: 'De expedición' },
}

/** Contador de espacios del rancho; al tocarlo enseña quién está fuera guardando su hueco */
export function RanchSlots({ game, ranch }: { game: GameState; ranch: number }) {
  const [open, setOpen] = useState(false)
  const away = game.owned.filter((m) => m.ranch === ranch && monPlace(game, m.uid) !== MonPlace.Ranch)

  return (
    <div className="ranch-slots">
      <button className="ranch-slots-button small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ItemIcon item={ICON.Ranch} size={22} /> Rancho {ranch + 1} · <strong>{usedSlots(game, ranch)}</strong>/{RANCH_SLOTS}
      </button>
      {open && (
        <div className="card ranch-away small">
          {away.length === 0 && <span className="muted">Todos los de este rancho están en casa.</span>}
          {away.map((m) => (
            <div key={m.uid} className="row gap">
              <Sprite id={m.speciesId} size={32} animated={false} />
              <span className="grow">{species(m.speciesId).name}</span>
              <span className="tiny muted">
                <ItemIcon item={OUT_LABEL[monPlace(game, m.uid)]!.icon} size={16} /> {OUT_LABEL[monPlace(game, m.uid)]!.text} · {slotsOf(m.speciesId)} esp.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
