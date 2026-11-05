import { species } from '../../data/species'
import type { OwnedMon } from '../../game/core/state'
import { maxHp } from '../../game/team/stats'
import { Bar, Sprite } from './common'
import './mon-picker.css'

/** Fila deslizable de tarjetas para elegir a qué Pokémon enviar (expediciones, jefes): sprite, nombre, nivel y PS */
export function MonPicker({ mons, selectedUid, onSelect }: { mons: OwnedMon[]; selectedUid?: string; onSelect: (uid: string) => void }) {
  return (
    <div className="mon-picker" role="listbox">
      {mons.map((m) => {
        const name = species(m.speciesId).name
        const selected = m.uid === selectedUid
        return (
          <button
            key={m.uid}
            role="option"
            aria-selected={selected}
            className={`mon-pick ${selected ? 'selected' : ''}`}
            onClick={() => onSelect(m.uid)}
            aria-label={`${name} Nv. ${m.level}`}
          >
            <Sprite id={m.speciesId} size={64} animated={false} />
            <span className="mon-pick-name tiny">{name}</span>
            <span className="mon-pick-level tiny">Nv. {m.level}</span>
            <Bar value={m.hp} max={maxHp(m)} kind="hp" />
          </button>
        )
      })}
    </div>
  )
}
