import { useState } from 'react'
import { MonPlace, monPlace, type GameState } from '../../game/core/state'
import { expeditionSlots } from '../../game/team/expedition'
import { MonPicker } from '../shared/MonPicker'
import { ExpeditionForm } from './ExpeditionForm'
import { ExpeditionList } from './ExpeditionList'
import './expeditions.css'

export function ExpeditionScreen({ game }: { game: GameState }) {
  const home = game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch)
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
        <MonPicker mons={home} selectedUid={mon?.uid} onSelect={setSelectedUid} />
        {mon && <ExpeditionForm key={mon.uid} game={game} mon={mon} />}
      </div>
    </div>
  )
}
