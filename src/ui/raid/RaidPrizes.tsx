import type { GameState } from '../../game/core/state'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { pendingPrizesText, useRaidPrizeCollect } from './useRaidPrizeCollect'
import './raid.css'

/** Aviso a lo ancho, en la pestaña Raids, de que hay premios de jefes sin recoger */
export function RaidPrizeBanner({ game }: { game: GameState }) {
  const { collect, overlay } = useRaidPrizeCollect()
  if (game.raidPrizes.length === 0) return <>{overlay}</>
  return (
    <>
      {overlay}
      <div className="raid-prize-banner">
        <ItemIcon item={ICON.Raid} size={40} />
        <span className="grow">
          <strong className="small">{game.raidPrizes.length > 1 ? '¡Tienes premios por recoger!' : '¡Tienes un premio por recoger!'}</strong>
          <span className="tiny muted raid-prize-detail">{pendingPrizesText(game)}</span>
        </span>
        <button className="btn primary small" onClick={collect}>
          Recoger
        </button>
      </div>
    </>
  )
}
