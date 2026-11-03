import { RANCH_TYPE_IDS, RANCH_TYPES } from '../../data/ranchTypes'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { placedRanchType } from '../../game/team/ranchPassives'
import { placeRanchType, ranchTypeAvailable, removeRanchType } from '../../game/team/ranchTypes'
import { TypeBadge } from '../shared/common'

/** Tipo del rancho: el que tiene puesto (y quitarlo) y los guardados que se le pueden poner */
export function RanchTypeSection({ game, ranch }: { game: GameState; ranch: number }) {
  const placed = placedRanchType(game, ranch)
  const stored = RANCH_TYPE_IDS.filter((id) => id !== placed && ranchTypeAvailable(game, id) > 0)

  return (
    <div className="ranch-type">
      <div className="row gap">
        <strong className="grow">{placed ? `Rancho ${RANCH_TYPES[placed].name}` : 'Rancho normal'}</strong>
        {placed && (
          <button className="btn small" onClick={() => act((s) => removeRanchType(s, ranch))}>
            Quitar
          </button>
        )}
      </div>
      {placed ? (
        <span className="row gap small">
          Hace falta un Pokémon menos de {RANCH_TYPES[placed].favors.map((t) => <TypeBadge key={t} type={t} />)} para cada nivel.
        </span>
      ) : (
        <span className="small muted">Sin efecto. Ponle un tipo de rancho para necesitar menos Pokémon en sus pasivas.</span>
      )}
      {stored.length > 0 ? (
        <div className="ranch-type-options">
          {stored.map((id) => (
            <button key={id} className="btn small" onClick={() => act((s) => placeRanchType(s, ranch, id))}>
              Poner {RANCH_TYPES[id].name} ×{ranchTypeAvailable(game, id)}
            </button>
          ))}
        </div>
      ) : (
        !placed && <span className="tiny muted">Los tipos de rancho se compran en la Tienda.</span>
      )}
    </div>
  )
}
