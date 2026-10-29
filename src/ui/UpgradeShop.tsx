import type { GameState } from '../game/state'
import { act } from '../game/store'
import { buyUpgrade, nextUpgradePrice, UPGRADE_IDS, UPGRADES, upgradeLevel, type UpgradeId } from '../game/upgrades'

/** Pestaña Tienda: mejoras permanentes que se pagan con pokécuartos */
export function UpgradeShop({ game }: { game: GameState }) {
  return (
    <div className="screen scroll">
      <h2 className="section-title">Mejoras</h2>
      {UPGRADE_IDS.map((id) => (
        <UpgradeCard key={id} game={game} id={id} />
      ))}
    </div>
  )
}

function UpgradeCard({ game, id }: { game: GameState; id: UpgradeId }) {
  const info = UPGRADES[id]
  const level = upgradeLevel(game, id)
  const price = nextUpgradePrice(game, id)

  return (
    <div className="card upgrade-card">
      <span className="upgrade-icon">{info.icon}</span>
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
