import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { collectRaidPrizes } from '../../game/raid/raidPrizes'
import { useRaidFeed } from '../../net/raidFeed'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { raidPrizeRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { BigAction } from '../shared/sheet/MonSheet'
import { RaidFront } from './RaidFront'
import { RaidLocal } from './RaidLocal'
import { RaidRooms } from './RaidRooms'
import './raid.css'

type RaidTab = 'boss' | 'rooms'

/**
 * Pestaña Ruta › Raids. Con servidor, el jefe y las salas son los suyos, iguales para todos: «Jefe» (la sala del
 * frontal o la tuya) y «Salas» (todas las del jefe y, para mirar, las de ruta con jugadores). Sin servidor, la sala
 * local de siempre
 */
export function RaidScreen({ game }: { game: GameState }) {
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const [tab, setTab] = useState<RaidTab>('boss')
  const feed = useRaidFeed()
  if (game.tutorial !== null) {
    return (
      <div className="screen scroll">
        <p className="notice">Termina el tutorial para luchar contra los jefes comunitarios.</p>
      </div>
    )
  }

  const pending = game.raidPrizes.length
  const rooms = feed.feed?.rooms.length ?? 0

  return (
    <div className="screen raid-screen">
      {report && <RewardOverlay title="¡Premio del jefe!" items={report} onClose={() => setReport(null)} />}
      {game.raidServer && (
        <div className="segmented raid-tabs">
          <button className={tab === 'boss' ? 'active' : ''} onClick={() => setTab('boss')}>
            <ItemIcon item={ICON.Raid} size={20} /> Jefe
          </button>
          <button className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>
            Salas {rooms > 0 && <span className="count-badge">{rooms}</span>}
          </button>
        </div>
      )}
      {pending > 0 && (
        <div className="raid-prize-bar">
          <BigAction icon={ICON.Raid} label={`Recoger premio${pending > 1 ? `s (${pending})` : ''}`} className="primary" onClick={() => setReport(raidPrizeRewards(act(collectRaidPrizes)))} />
        </div>
      )}
      {!game.raidServer ? (
        <RaidLocal game={game} />
      ) : tab === 'rooms' ? (
        <RaidRooms game={game} state={feed} onWatch={() => setTab('boss')} />
      ) : (
        <RaidFront game={game} state={feed} />
      )}
    </div>
  )
}
