import type { CSSProperties } from 'react'
import { MonPlace, monPlace, type GameState } from '../../game/core/state'
import type { useSwipe } from '../shared/useSwipe'
import { RanchMon, type RanchDrop } from './RanchMon'
import { ranchFilter } from './ranchLooks'

interface Props {
  game: GameState
  ranch: number
  /** Gestos para pasar de rancho, solo en el rancho que se está viendo (el de al lado solo se asoma) */
  swipe?: ReturnType<typeof useSwipe>
  selectedUid: string | null
  onSelect: (uid: string) => void
  onDrop: (uid: string, drop: RanchDrop) => void
  style?: CSSProperties
}

/** Un rancho como una foto: su fondo con el tono de su tipo y los Pokémon que hay en él */
export function RanchPage({ game, ranch, swipe, selectedUid, onSelect, onDrop, style }: Props) {
  const home = game.owned.filter((m) => m.ranch === ranch && monPlace(game, m.uid) === MonPlace.Ranch)
  return (
    <div className={`ranch-page ${swipe ? '' : 'peek'}`} style={style} aria-hidden={!swipe}>
      <div className="ranch-ground" style={{ filter: ranchFilter(ranch, game.ranchTypeOf[ranch]) }} {...swipe} />
      {home.map((m) => (
        <RanchMon
          key={m.uid}
          mon={m}
          selected={m.uid === selectedUid}
          active={m.uid === game.activeUid}
          onClick={() => onSelect(m.uid)}
          onDrop={(drop) => onDrop(m.uid, drop)}
        />
      ))}
      {home.length === 0 && (
        <p className="ranch-empty small">{game.owned.length === 0 ? 'Aún no tienes Pokémon.' : 'No hay ningún Pokémon en este rancho.'}</p>
      )}
    </div>
  )
}
