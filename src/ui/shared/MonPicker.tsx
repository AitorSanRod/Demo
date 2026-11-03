import { species } from '../../data/species'
import type { OwnedMon } from '../../game/core/state'
import { Sprite } from './common'
import './mon-picker.css'

/** Fila deslizable de Pokémon para elegir a cuál enviar (expediciones, jefes) */
export function MonPicker({ mons, selectedUid, onSelect }: { mons: OwnedMon[]; selectedUid?: string; onSelect: (uid: string) => void }) {
  return (
    <div className="mon-picker">
      {mons.map((m) => (
        <button
          key={m.uid}
          className={`mon-pick ${m.uid === selectedUid ? 'selected' : ''}`}
          onClick={() => onSelect(m.uid)}
          aria-label={`${species(m.speciesId).name} Nv. ${m.level}`}
        >
          <Sprite id={m.speciesId} size={48} animated={false} />
          <span className="tiny">Nv. {m.level}</span>
        </button>
      ))}
    </div>
  )
}
