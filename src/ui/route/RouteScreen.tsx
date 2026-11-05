import { useState } from 'react'
import type { Item } from '../../data/items'
import { activeMon, type GameState } from '../../game/core/state'
import { isExpeditionDone } from '../../game/team/expedition'
import { ExpeditionScreen } from '../expeditions/ExpeditionScreen'
import { RaidScreen } from '../raid/RaidScreen'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { pendingKey, useUnseen } from '../shared/useUnseen'
import { RouteMap } from './RouteMap'
import { RunView } from './RunView'
import './route.css'

type RouteTab = 'route' | 'expeditions' | 'raid'

/** Pestaña Ruta: la ruta del Pokémon activo (mapa o ruta en curso), las expediciones del resto y el jefe comunitario */
export function RouteScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<RouteTab>('route')
  const mon = activeMon(game)
  const returned = game.expeditions.filter(isExpeditionDone)
  const prizes = game.raidPrizes
  const returnedUnseen = useUnseen('route:expeditions', pendingKey(returned.map((e) => e.uid)), tab === 'expeditions')
  const prizesUnseen = useUnseen('route:raid', pendingKey(prizes.map((p) => `${p.bossSpeciesId}:${p.uid}`)), tab === 'raid')

  const tabButton = (id: RouteTab, icon: Item, label: string, count: number) => (
    <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-label={label} aria-pressed={tab === id}>
      <span className="icon-tab-icon">
        <ItemIcon item={icon} size={26} />
        {count > 0 && <span className="count-badge">{count}</span>}
      </span>
      <span className="icon-tab-label">{label}</span>
    </button>
  )

  return (
    <div className="screen tabbed">
      <div className="segmented icon-tabs tabbed-bar">
        {tabButton('route', ICON.Route, 'Ruta', 0)}
        {tabButton('expeditions', ICON.Expedition, 'Expediciones', returnedUnseen ? returned.length : 0)}
        {tabButton('raid', ICON.Raid, 'Raids', prizesUnseen ? prizes.length : 0)}
      </div>
      <div className="tabbed-body">
        {tab === 'raid' ? (
          <RaidScreen game={game} />
        ) : tab === 'expeditions' ? (
          <ExpeditionScreen game={game} />
        ) : game.run && mon ? (
          <RunView game={game} run={game.run} mon={mon} />
        ) : (
          <RouteMap game={game} />
        )}
      </div>
    </div>
  )
}
