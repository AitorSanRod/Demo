import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import type { Item } from '../../data/items'
import { buyUpgrade, nextUpgradePrice, UPGRADE_IDS, UPGRADES, upgradeLevel, type UpgradeId } from '../../game/team/upgrades'
import './shop.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RanchTypeShop } from './RanchTypeShop'
import { StoneShop } from './StoneShop'

/** Pestaña Tienda: mejoras permanentes que se pagan con pokécuartos */
const UPGRADE_ICON: Record<UpgradeId, Item> = { expeditionSlots: ICON.Expedition, ranches: ICON.Ranch }

export function UpgradeShop({ game }: { game: GameState }) {
  return (
    <div className="screen scroll">
      <h2 className="section-title">Mejoras</h2>
      {UPGRADE_IDS.map((id) => (
        <UpgradeCard key={id} game={game} id={id} />
      ))}
      <RanchTypeShop game={game} />
      <StoneShop game={game} />
    </div>
  )
}

function UpgradeCard({ game, id }: { game: GameState; id: UpgradeId }) {
  const info = UPGRADES[id]
  const level = upgradeLevel(game, id)
  const price = nextUpgradePrice(game, id)

  return (
    <div className="card upgrade-card">
      <ItemIcon item={UPGRADE_ICON[id]} size={48} />
      <div className="grow">
        <strong>{info.name}</strong>
        <p className="small muted">{info.description}</p>
        <span className="tiny muted">
          Nivel {level}/{info.prices.length}
        </span>
      </div>
      {price === null ? (
        <span className="tag ok">Comprada</span>
      ) : (
        <button className="btn primary small" disabled={game.money < price} onClick={() => act((s) => buyUpgrade(s, id))}>
          ₽ {price}
        </button>
      )}
    </div>
  )
}
