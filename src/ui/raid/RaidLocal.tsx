import type { GameState } from '../../game/core/state'
import { raidWaiting } from '../../game/raid/raid'
import { presentMembers, RAID_ROOM_SIZE } from '../../game/raid/raidRoom'
import { MonSection } from '../shared/sheet/MonSheet'
import { RaidJoin } from './RaidJoin'
import { RaidRoster } from './RaidRoster'
import { RaidScene } from './RaidScene'
import { RaidWaiting } from './RaidWaiting'

/** Sin servidor: el jefe de la pestaña Raids se juega en local, con bots (la sala de la partida) */
export function RaidLocal({ game }: { game: GameState }) {
  const raid = game.raid
  if (!raid) return null
  if (raidWaiting(raid)) return <RaidWaiting game={game} raid={raid} />
  return (
    <>
      <RaidScene game={game} raid={raid} />
      <div className="mon-card">
        <MonSection title={`En la sala · ${presentMembers(raid).length}/${RAID_ROOM_SIZE}`}>
          <RaidRoster raid={raid} timeScale={game.timeScale} />
        </MonSection>
        <MonSection title="Tu Pokémon">
          <RaidJoin game={game} raid={raid} />
        </MonSection>
      </div>
    </>
  )
}
