import { STONE_IDS, STONES, type Stone } from '../../data/stones'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyStone, STONE_PRICE, stonesOf } from '../../game/team/stones'
import { ItemIcon } from '../shared/ItemIcon'

/** Piedras evolutivas a la venta: se guardan y se gastan al evolucionar desde la ficha del Pokémon */
export function StoneShop({ game }: { game: GameState }) {
  return (
    <>
      <h2 className="section-title">Piedras evolutivas</h2>
      <p className="small muted">Algunos Pokémon evolucionan con una piedra, a cualquier nivel. Se gastan al evolucionar.</p>
      {STONE_IDS.map((id) => (
        <StoneCard key={id} game={game} id={id} />
      ))}
    </>
  )
}

function StoneCard({ game, id }: { game: GameState; id: Stone }) {
  const info = STONES[id]
  return (
    <div className="card upgrade-card">
      <ItemIcon item={info.item} size={48} />
      <div className="grow">
        <strong>{info.name}</strong>
        <span className="tiny muted">Tienes {stonesOf(game, id)}</span>
      </div>
      <button className="btn primary small" disabled={game.money < STONE_PRICE} onClick={() => act((s) => buyStone(s, id))}>
        ₽ {STONE_PRICE}
      </button>
    </div>
  )
}
