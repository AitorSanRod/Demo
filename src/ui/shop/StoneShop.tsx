import { STONE_IDS, STONES, type Stone } from '../../data/stones'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyStone, STONE_PRICE, stonesOf } from '../../game/team/stones'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { ShopSection, ShopTile } from './ShopTile'

/** Piedras evolutivas a la venta: se guardan en la Mochila y se gastan al evolucionar desde la ficha del Pokémon */
export function StoneShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Piedras evolutivas"
      art={ICON.Evolve}
      tone="shop-fold-stones"
      hint="Algunos Pokémon evolucionan con una piedra, a cualquier nivel. Se guardan en la Mochila y se gastan al evolucionar."
    >
      {STONE_IDS.map((id) => (
        <StoneTile key={id} game={game} id={id} />
      ))}
    </ShopSection>
  )
}

function StoneTile({ game, id }: { game: GameState; id: Stone }) {
  const info = STONES[id]
  return (
    <ShopTile
      icon={<ItemIcon item={info.item} size={48} />}
      name={info.name}
      action={
        <button className="btn primary small" disabled={game.money < STONE_PRICE} onClick={() => act((s) => buyStone(s, id))}>
          ₽ {STONE_PRICE}
        </button>
      }
    >
      <span className="tiny muted">Tienes {stonesOf(game, id)}</span>
    </ShopTile>
  )
}
