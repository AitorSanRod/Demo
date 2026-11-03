import { useState } from 'react'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { BOX_SLOTS, boxedMons } from '../../game/team/ranches'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { MovePanel } from '../shared/sheet/MovePanel'

/** Contenido de la Caja: sus huecos y, al tocar un Pokémon, a qué rancho sacarlo */
export function BoxSheet({ game }: { game: GameState }) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const boxed = boxedMons(game)
  const selected = selectedUid ? findMon(game, selectedUid) : undefined

  return (
    <>
      <div className="row between">
        <h2 className="with-icon"><ItemIcon item={ICON.Box} size={32} /> Caja</h2>
        <span className="small muted">
          {boxed.length}/{BOX_SLOTS}
        </span>
      </div>
      <p className="tiny muted">Aquí solo se guardan: no descansan, ni se entrenan, ni salen de ruta. Arrastra un Pokémon del rancho al botón de la Caja para guardarlo.</p>
      <div className="box-grid">
        {Array.from({ length: BOX_SLOTS }, (_, i) => {
          const mon = boxed[i]
          if (!mon) return <span key={i} className="box-slot empty" />
          return (
            <button
              key={mon.uid}
              className={`box-slot ${mon.uid === selected?.uid ? 'selected' : ''}`}
              onClick={() => setSelectedUid(mon.uid)}
              aria-label={`${species(mon.speciesId).name} Nv. ${mon.level}`}
            >
              <Sprite id={mon.speciesId} size={56} animated={false} />
              <span className="tiny">Nv. {mon.level}</span>
            </button>
          )
        })}
      </div>
      {selected && selected.ranch === null && <MovePanel game={game} mon={selected} onMoved={() => setSelectedUid(null)} />}
    </>
  )
}
