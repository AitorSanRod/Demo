import { useState } from 'react'
import { species } from '../../data/species'
import { Sprite } from '../shared/common'
import { matchingSpecies } from './speciesMatch'

/** Resultados como mucho bajo el buscador */
const MAX_RESULTS = 12

/** Buscador de especies por nombre: escribir y tocar una de las que salen */
export function SpeciesSearch({ onPick, exclude = [], placeholder }: { onPick: (id: number) => void; exclude?: number[]; placeholder: string }) {
  const [text, setText] = useState('')
  const results = matchingSpecies(text).filter((id) => !exclude.includes(id)).slice(0, MAX_RESULTS)

  return (
    <div className="species-search">
      <input className="text-input" type="search" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
      {results.length > 0 && (
        <div className="species-results">
          {results.map((id) => (
            <button key={id} className="species-result" onClick={() => (onPick(id), setText(''))}>
              <Sprite id={id} size={40} animated={false} />
              <span className="tiny">{species(id).name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
