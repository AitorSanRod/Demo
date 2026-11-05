import type { ReactNode } from 'react'
import { RARITY_INFO, rarityOf, SPECIES } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import { canCombine, CombineKind, combineKind, PIECES_PER_COMBINE, piecesOf } from '../../game/collection/pieces'
import type { GameState } from '../../game/core/state'
import { Sprite } from '../shared/common'
import { HeartIcon } from '../shared/HeartIcon'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { PixelQuestion } from '../shared/PixelQuestion'

/** Etiqueta sobre la casilla que ya se puede combinar */
const READY_TAG: Record<CombineKind, string> = {
  [CombineKind.Unlock]: '¡Crear!',
  [CombineKind.Star]: '+1 ★',
  [CombineKind.Money]: '₽',
}

interface Props {
  game: GameState
  sp: (typeof SPECIES)[number]
  selected: boolean
  tutorialTarget: boolean
  onSelect: () => void
  /** Línea extra al pie de la casilla (el precio en la tienda de MissingNo) */
  footer?: ReactNode
  /** Sin tocar; por defecto, las especies sin descubrir y sin tickets */
  disabled?: boolean
}

export function DexCell({ game, sp, selected, tutorialTarget, onSelect, footer, disabled }: Props) {
  const caught = game.caught.includes(sp.id)
  const seen = caught || game.seen.includes(sp.id)
  const pieces = piecesOf(game, sp.id)
  const ready = canCombine(game, sp.id)
  return (
    <button
      className={`dex-cell ${caught ? 'caught' : ''} ${ready ? 'ready' : ''} ${selected ? 'selected' : ''} ${tutorialTarget ? 'tutorial-target' : ''}`}
      style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color }}
      disabled={disabled ?? (!seen && pieces === 0)}
      onClick={onSelect}
    >
      <span className="tiny muted">#{String(sp.id).padStart(3, '0')}</span>
      {isFavorite(game, sp.id) && <HeartIcon size={16} className="dex-favorite" />}
      {ready && <span className="dex-ready-tag tiny">{READY_TAG[combineKind(game, sp.id)]}</span>}
      {seen ? <Sprite id={sp.id} size={72} animated={false} silhouette={!caught} /> : <PixelQuestion size={72} />}
      <span className="tiny">{seen ? sp.name : '???'}</span>
      {pieces > 0 && (
        <span className="dex-pieces tiny">
          <ItemIcon item={ICON.Piece} size={14} /> {pieces}/{PIECES_PER_COMBINE}
        </span>
      )}
      {footer}
    </button>
  )
}
