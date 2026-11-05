import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { raidBossAt } from '../../game/raid/raid'
import { tabRoomRotation } from '../../game/raid/online/linkedRoom'
import { RAID_ROTATIONS, roomRotation, type RaidRotation } from '../../game/raid/online/protocol'
import { useRaidFeed, type FeedState } from '../../net/raidFeed'
import { Sprite } from '../shared/common'
import { RaidFront } from './RaidFront'
import { RaidLocal } from './RaidLocal'
import { RaidPrizeBanner } from './RaidPrizes'
import { RaidRooms } from './RaidRooms'
import { ROTATION_LABEL } from './rotations'
import './raid.css'

const ROOMS_TAB = 'rooms'
type RaidTab = RaidRotation | typeof ROOMS_TAB

/** Tamaño del jefe en la pestaña de su rotación */
const TAB_SPRITE_SIZE = 24

/** La pestaña con la que se abre: la rotación de la sala de tu Pokémon o la de la sala que mirabas */
const firstTab = (game: GameState, feed: FeedState): RaidTab => (game.raid ? tabRoomRotation(game.raid) : roomRotation(feed.watchRoomId))

/**
 * Pestaña Ruta › Raids. Con servidor, los jefes y las salas son los suyos, iguales para todos: una pestaña por rotación
 * de jefes (la sala del frontal o la tuya) y «Salas» (todas las de los jefes y, para mirar, las de ruta con jugadores).
 * Sin servidor, la sala local de siempre
 */
export function RaidScreen({ game }: { game: GameState }) {
  const feed = useRaidFeed()
  const [tab, setTab] = useState<RaidTab>(() => firstTab(game, feed))
  if (game.tutorial !== null) {
    return (
      <div className="screen scroll">
        <p className="notice">Termina el tutorial para luchar contra los jefes comunitarios.</p>
      </div>
    )
  }

  const boards = feed.feed?.rotations ?? []
  const rooms = boards.reduce((n, b) => n + b.rooms.length, 0)
  const board = boards.find((b) => b.rotation === tab)

  return (
    <div className="screen raid-screen">
      {game.raidServer && (
        <div className="segmented raid-tabs">
          {RAID_ROTATIONS.map((rotation) => {
            const boss = boards.find((b) => b.rotation === rotation)
            return (
              <button key={rotation} className={tab === rotation ? 'active' : ''} onClick={() => setTab(rotation)}>
                {boss && <Sprite id={raidBossAt(boss.bossIndex).speciesId} size={TAB_SPRITE_SIZE} animated={false} />}
                {ROTATION_LABEL[rotation]}
              </button>
            )
          })}
          <button className={tab === ROOMS_TAB ? 'active' : ''} onClick={() => setTab(ROOMS_TAB)}>
            Salas {rooms > 0 && <span className="count-badge">{rooms}</span>}
          </button>
        </div>
      )}
      <RaidPrizeBanner game={game} />
      {!game.raidServer ? (
        <RaidLocal game={game} />
      ) : tab === ROOMS_TAB ? (
        <RaidRooms game={game} state={feed} onWatch={setTab} />
      ) : (
        <RaidFront game={game} state={feed} board={board ?? null} />
      )}
    </div>
  )
}
