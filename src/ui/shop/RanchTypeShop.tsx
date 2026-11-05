import { typeGemSprite } from '../../data/items'
import { RANCH_TYPE_IDS, RANCH_TYPE_MAX_OWNED, RANCH_TYPES, type RanchTypeId } from '../../data/ranchTypes'
import type { PokeType } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyRanchType, ranchTypeBuyBlocker, ranchTypeOwned } from '../../game/team/ranchTypes'
import { TypeBadge } from '../shared/common'
import { ICON } from '../shared/icons'
import { ShopSection, ShopTile } from './ShopTile'

/** Tipos de rancho a la venta: cada uno favorece a uno o dos tipos de Pokémon; se colocan desde el panel del rancho */
export function RanchTypeShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Tipos de rancho"
      art={ICON.Ranch}
      tone="shop-fold-ranch"
      hint={`Colócalos desde el botón de arriba a la izquierda del rancho: en ese rancho hará falta un Pokémon menos de sus tipos para cada nivel de pasiva. Como mucho ${RANCH_TYPE_MAX_OWNED} de cada uno.`}
    >
      {RANCH_TYPE_IDS.map((id) => (
        <RanchTypeTile key={id} game={game} id={id} />
      ))}
    </ShopSection>
  )
}

/** Las gemas de los tipos que favorece, juntas */
export function RanchTypeGems({ types }: { types: readonly PokeType[] }) {
  return (
    <span className="ranch-type-gems">
      {types.map((t) => (
        <img key={t} className="item-icon" src={typeGemSprite(t)} width={40} height={40} alt="" draggable={false} />
      ))}
    </span>
  )
}

function RanchTypeTile({ game, id }: { game: GameState; id: RanchTypeId }) {
  const info = RANCH_TYPES[id]
  const owned = ranchTypeOwned(game, id)
  const blocker = ranchTypeBuyBlocker(game, id)

  return (
    <ShopTile
      icon={<RanchTypeGems types={info.favors} />}
      name={`Rancho ${info.name}`}
      action={
        owned >= RANCH_TYPE_MAX_OWNED ? (
          <span className="tag ok">Completo</span>
        ) : (
          <button className="btn primary small" disabled={!!blocker} title={blocker ?? undefined} onClick={() => act((s) => buyRanchType(s, id))}>
            ₽ {info.price}
          </button>
        )
      }
    >
      <span className="row gap shop-tile-types">
        {info.favors.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </span>
      <span className="tiny muted">
        Tienes {owned}/{RANCH_TYPE_MAX_OWNED}
      </span>
    </ShopTile>
  )
}
