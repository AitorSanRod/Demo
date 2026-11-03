import type { RouteId } from '../../data/maps'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { collectRaidPrizes, routeRaidPrizes } from '../../game/raid/raidPrizes'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { raidPrizeRewards } from '../shared/rewardItems'
import type { RewardItem } from '../shared/RewardOverlay'

/**
 * Jefe comunitario en la línea de su ruta: «Premio» si cayó uno de sus jefes y queda premio por recoger o, si no, el
 * jefe activo cuando vive en ella
 */
export function RouteRaidMark({ game, routeId, onCollect }: { game: GameState; routeId: RouteId; onCollect: (items: RewardItem[]) => void }) {
  const boss = game.raid?.boss

  if (routeRaidPrizes(game, routeId).length > 0) {
    return (
      <button className="btn primary small with-icon" onClick={() => onCollect(raidPrizeRewards(act((s) => collectRaidPrizes(s, routeId))))}>
        <ItemIcon item={ICON.Raid} size={18} /> Premio
      </button>
    )
  }
  if (boss?.routeId !== routeId) return null
  return (
    <span className="route-raid" title={`Jefe comunitario: ${species(boss.speciesId).name}`}>
      <ItemIcon item={ICON.Raid} size={22} />
      <Sprite id={boss.speciesId} size={36} animated={false} />
    </span>
  )
}
