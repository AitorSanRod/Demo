import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { isSeen, knownName } from '../../game/collection/dex'
import type { GameState } from '../../game/core/state'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

interface Props {
  game: GameState
  speciesId: number
  /** Tickets que tiene */
  count: number
  /** Tickets marcados para triturar */
  marked: number
  onMark: (marked: number) => void
}

/** Casilla de la trituradora, como las de la Pokédex: cada toque marca un ticket más; «Todos» y ✕ marcan o quitan de golpe */
export function ShredCell({ game, speciesId, count, marked, onMark }: Props) {
  const name = knownName(game, speciesId)
  const full = marked >= count
  return (
    <div className={`shred-cell ${marked > 0 ? 'marked' : ''}`}>
      <button
        className="dex-cell caught"
        style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(species(speciesId))].color }}
        disabled={full}
        onClick={() => onMark(marked + 1)}
        aria-label={`Marcar un ticket de ${name}`}
      >
        <Sprite id={speciesId} size={72} animated={false} silhouette={!isSeen(game, speciesId)} />
        <span className="tiny">{name}</span>
        <span className="dex-pieces tiny">
          <ItemIcon item={ICON.Piece} size={14} /> {marked > 0 ? `${marked}/${count}` : count}
        </span>
      </button>
      {marked > 0 ? (
        <button className="shred-cell-corner" onClick={() => onMark(0)} aria-label={`Desmarcar ${name}`}>
          ✕
        </button>
      ) : (
        count > 1 && (
          <button className="shred-cell-corner all" onClick={() => onMark(count)} aria-label={`Marcar todos los tickets de ${name}`}>
            Todos
          </button>
        )
      )}
    </div>
  )
}
