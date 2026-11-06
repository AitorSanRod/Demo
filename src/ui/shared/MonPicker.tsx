import { species } from '../../data/species'
import type { OwnedMon } from '../../game/core/state'
import { maxHp } from '../../game/team/stats'
import { Bar, Sprite } from './common'
import { HeartIcon } from './HeartIcon'
import './mon-picker.css'

/** Por qué un Pokémon sale desactivado: es favorito (lleva el corazón) o por otra razón */
export type MonLock = 'favorite' | 'other'

interface Props {
  mons: OwnedMon[]
  selectedUid?: string
  onSelect: (uid: string) => void
  /** Los que se enseñan pero no se pueden elegir; sin ella, todos se pueden */
  lockOf?: (m: OwnedMon) => MonLock | null
}

/** Fila deslizable de tarjetas para elegir un Pokémon (expediciones, jefes, intercambios): sprite, nombre, nivel y PS */
export function MonPicker({ mons, selectedUid, onSelect, lockOf = () => null }: Props) {
  return (
    <div className="mon-picker" role="listbox">
      {mons.map((m) => {
        const name = species(m.speciesId).name
        const selected = m.uid === selectedUid
        const lock = lockOf(m)
        return (
          <button
            key={m.uid}
            role="option"
            aria-selected={selected}
            className={`mon-pick ${selected ? 'selected' : ''}`}
            disabled={lock !== null}
            onClick={() => onSelect(m.uid)}
            aria-label={`${name} Nv. ${m.level}${lock === 'favorite' ? ', favorito' : ''}`}
          >
            {lock === 'favorite' && <HeartIcon className="mon-pick-heart" />}
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
