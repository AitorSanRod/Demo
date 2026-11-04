import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { raidWaiting } from '../../game/raid/raid'
import { collectRaidPrizes } from '../../game/raid/raidPrizes'
import { presentMembers, RAID_ROOM_SIZE } from '../../game/raid/raidRoom'
import { ICON } from '../shared/icons'
import { raidPrizeRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { BigAction, MonSection } from '../shared/sheet/MonSheet'
import { RaidJoin } from './RaidJoin'
import { RaidRoster } from './RaidRoster'
import { RaidScene } from './RaidScene'
import { RaidWaiting } from './RaidWaiting'
import './raid.css'

/** Pestaña Ruta › Raids: el jefe comunitario, la sala luchando contra él y tu Pokémon en ella */
export function RaidScreen({ game }: { game: GameState }) {
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const raid = game.raid
  if (!raid) {
    return (
      <div className="screen scroll">
        <p className="notice">Termina el tutorial para luchar contra los jefes comunitarios.</p>
      </div>
    )
  }

  const collect = () => setReport(raidPrizeRewards(act(collectRaidPrizes)))
  const pending = game.raidPrizes.length

  return (
    <div className="screen raid-screen">
      {report && <RewardOverlay title="¡Premio del jefe!" items={report} onClose={() => setReport(null)} />}
      {raidWaiting(raid) ? <RaidWaiting game={game} raid={raid} /> : <RaidScene game={game} raid={raid} />}
      <div className="mon-card">
        {pending > 0 && <BigAction icon={ICON.Raid} label={`Recoger premio${pending > 1 ? `s (${pending})` : ''}`} className="primary" onClick={collect} />}
        {!raidWaiting(raid) && (
          <>
            <MonSection title={`En la sala · ${presentMembers(raid).length}/${RAID_ROOM_SIZE}`}>
              <RaidRoster raid={raid} timeScale={game.timeScale} />
            </MonSection>
            <MonSection title="Tu Pokémon">
              <RaidJoin game={game} raid={raid} />
            </MonSection>
          </>
        )}
      </div>
    </div>
  )
}
