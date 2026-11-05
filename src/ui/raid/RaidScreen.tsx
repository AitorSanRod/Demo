import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { useRaidFeed } from '../../net/raidFeed'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RaidFront } from './RaidFront'
import { RaidLocal } from './RaidLocal'
import { RaidPrizeBanner } from './RaidPrizes'
import { RaidRooms } from './RaidRooms'
import './raid.css'

type RaidTab = 'boss' | 'rooms'

/**
 * Pestaña Ruta › Raids. Con servidor, el jefe y las salas son los suyos, iguales para todos: «Jefe» (la sala del
 * frontal o la tuya) y «Salas» (todas las del jefe y, para mirar, las de ruta con jugadores). Sin servidor, la sala
 * local de siempre
 */
export function RaidScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<RaidTab>('boss')
  const feed = useRaidFeed()
  if (game.tutorial !== null) {
    return (
      <div className="screen scroll">
        <p className="notice">Termina el tutorial para luchar contra los jefes comunitarios.</p>
      </div>
    )
  }

  const rooms = feed.feed?.rooms.length ?? 0

  return (
    <div className="screen raid-screen">
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
      <RaidPrizeBanner game={game} />
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
