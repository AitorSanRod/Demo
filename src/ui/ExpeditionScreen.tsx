import { useState } from 'react'
import { species } from '../data/species'
import { expeditionSlots } from '../game/expedition'
import { monPlace, type GameState } from '../game/state'
import { Sprite } from './common'
import { ExpeditionForm, ExpeditionList } from './Expeditions'

export function ExpeditionScreen({ game }: { game: GameState }) {
  const home = game.owned.filter((m) => monPlace(game, m.uid) === 'ranch')
  const [selectedUid, setSelectedUid] = useState('')
  const mon = home.find((m) => m.uid === selectedUid) ?? home[0]

  return (
    <div className="screen scroll">
      <div className="row between">
        <h2 className="section-title">En expedición</h2>
        <span className="small muted">
          Huecos {game.expeditions.length}/{expeditionSlots(game)}
        </span>
      </div>
      <ExpeditionList game={game} />

      <h2 className="section-title">Enviar de expedición</h2>
      <div className="card">
        {home.length === 0 && <p className="small muted">No queda ningún Pokémon en el rancho.</p>}
        <div className="expedition-picker">
          {home.map((m) => (
            <button
              key={m.uid}
              className={`expedition-pick ${m.uid === mon?.uid ? 'selected' : ''}`}
              onClick={() => setSelectedUid(m.uid)}
              aria-label={`${species(m.speciesId).name} Nv. ${m.level}`}
            >
              <Sprite id={m.speciesId} size={48} animated={false} />
              <span className="tiny">Nv. {m.level}</span>
            </button>
          ))}
        </div>
        {mon && <ExpeditionForm key={mon.uid} game={game} mon={mon} />}
      </div>
    </div>
  )
}
