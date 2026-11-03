import { RANCH_TYPE_IDS, RANCH_TYPE_MAX_OWNED, RANCH_TYPES, type RanchTypeId } from '../../data/ranchTypes'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyRanchType, ranchTypeBuyBlocker, ranchTypeOwned } from '../../game/team/ranchTypes'
import { TypeBadge } from '../shared/common'

/** Tipos de rancho a la venta: cada uno favorece a uno o dos tipos de Pokémon; se colocan desde el panel del rancho */
export function RanchTypeShop({ game }: { game: GameState }) {
  return (
    <>
      <h2 className="section-title">Tipos de rancho</h2>
      <p className="small muted">
        Colócalos desde el botón de arriba a la izquierda del rancho: en ese rancho hará falta un Pokémon menos de sus tipos para cada
        nivel de pasiva. Como mucho {RANCH_TYPE_MAX_OWNED} de cada uno.
      </p>
      {RANCH_TYPE_IDS.map((id) => (
        <RanchTypeCard key={id} game={game} id={id} />
      ))}
    </>
  )
}

function RanchTypeCard({ game, id }: { game: GameState; id: RanchTypeId }) {
  const info = RANCH_TYPES[id]
  const owned = ranchTypeOwned(game, id)
  const blocker = ranchTypeBuyBlocker(game, id)

  return (
    <div className="card upgrade-card">
      <div className="grow">
        <strong>Rancho {info.name}</strong>
        <span className="row gap">
          {info.favors.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </span>
        <span className="tiny muted">
          Tienes {owned}/{RANCH_TYPE_MAX_OWNED}
        </span>
      </div>
      {owned >= RANCH_TYPE_MAX_OWNED ? (
        <span className="tag ok">Completo</span>
      ) : (
        <button className="btn primary small" disabled={!!blocker} title={blocker ?? undefined} onClick={() => act((s) => buyRanchType(s, id))}>
          ₽ {info.price}
        </button>
      )}
    </div>
  )
}
