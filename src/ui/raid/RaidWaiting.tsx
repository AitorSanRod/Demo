import type { GameState } from '../../game/core/state'
import type { Raid } from '../../game/raid/raidRoom'
import { WalkScene } from '../route/WalkScene'
import { Sprite } from '../shared/common'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { raidBiome } from './raidBiome'
import '../route/battle.css'
import './raid-scene.css'

/** Mismo tamaño que el jefe en la pelea */
const BOSS_SPRITE_SIZE = 168

/** Entre un jefe y otro: la escena vacía con el siguiente en silueta y la cuenta atrás (en tiempo real) para que aparezca */
export function RaidWaiting({ game, raid }: { game: GameState; raid: Raid }) {
  return (
    <>
      <div className="raid-stage">
        <WalkScene biome={raidBiome(raid)} moving={false} speed={1}>
          <div className="route-battle">
            <div className="route-fighter enemy boss raid-boss-fighter">
              <div className="raid-idle boss">
                <Sprite id={raid.boss.speciesId} size={BOSS_SPRITE_SIZE} silhouette />
              </div>
            </div>
          </div>
        </WalkScene>
      </div>
      <div className="raid-summary">
        <div className="row between">
          <strong>Siguiente jefe</strong>
          <span className="small muted with-icon">
            <ItemIcon item={ICON.Raid} size={18} /> Jefe comunitario
          </span>
        </div>
        <p className="raid-eta">Aparece en {formatClock(raid.startsInMs / game.timeScale)}</p>
      </div>
    </>
  )
}
