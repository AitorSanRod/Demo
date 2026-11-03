import { isFavorite, isSeen, toggleFavorite } from '../../../game/collection/dex'
import type { GameState } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { HeartIcon } from '../HeartIcon'

/** Corazón de la esquina de la cabecera: marca la especie como favorita (sus tickets no se trituran) */
export function FavoriteButton({ game, speciesId }: { game: GameState; speciesId: number }) {
  if (!isSeen(game, speciesId)) return null
  const favorite = isFavorite(game, speciesId)
  const hint = favorite ? 'Favorito: sus tickets no se trituran' : 'Marcar como favorito'
  return (
    <button
      className={`favorite-button ${favorite ? 'on' : ''}`}
      aria-pressed={favorite}
      aria-label={hint}
      title={hint}
      onClick={() => act((s) => toggleFavorite(s, speciesId))}
    >
      <HeartIcon size={28} />
    </button>
  )
}
