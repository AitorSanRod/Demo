import { route } from '../../data/maps'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { raidMinutesLeft } from '../../game/raid/raidEstimate'
import type { Raid } from '../../game/raid/raidRoom'
import { Bar } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { fallText } from './fallText'
import { RaidBattleScene } from './RaidBattleScene'
import { raidBiome } from './raidBiome'
import { shownBossHp } from './roundReplay'
import './raid.css'

/**
 * El jefe comunitario: la pelea en su paisaje (el de su ruta o, sin ruta, el de su tipo) y debajo la vida que le queda
 * y cuánto tardará en caer al ritmo de la sala, en tiempo real
 */
export function RaidScene({ game, raid }: { game: GameState; raid: Raid }) {
  const sp = species(raid.boss.speciesId)
  const biome = raidBiome(raid)
  const gameMinutesLeft = raidMinutesLeft(game, raid)
  // La vida baja golpe a golpe, al ritmo de la escena (ver roundReplay.ts)
  const hp = shownBossHp(raid)
  const percent = Math.ceil((hp / raid.maxHp) * 100)

  return (
    <>
      <RaidBattleScene raid={raid} biome={biome} timeScale={game.timeScale} />
      <div className="raid-summary">
        <div className="row between">
          <strong>{sp.name}</strong>
          <span className="small muted with-icon">
            <ItemIcon item={ICON.Raid} size={18} /> Jefe comunitario{raid.place && ` · ${route(raid.place.routeId).name}`}
          </span>
        </div>
        <Bar value={hp} max={raid.maxHp} kind="hp" />
        <div className="row between small">
          <span>
            {percent}% · {hp} / {raid.maxHp} PS
          </span>
          <span className="raid-eta">
            {fallText(raid, gameMinutesLeft, game.timeScale)}
          </span>
        </div>
      </div>
    </>
  )
}
