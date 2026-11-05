import { useState } from 'react'
import { activeMon, type GameState } from '../../game/core/state'
import { isExpeditionDone } from '../../game/team/expedition'
import { ExpeditionScreen } from '../expeditions/ExpeditionScreen'
import { RaidScreen } from '../raid/RaidScreen'
import { IconTabs } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
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

  return (
    <div className="screen tabbed">
      <IconTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'route', icon: ICON.Route, label: 'Ruta' },
          { id: 'expeditions', icon: ICON.Expedition, label: 'Expediciones', count: returnedUnseen ? returned.length : 0 },
          { id: 'raid', icon: ICON.Raid, label: 'Raids', count: prizesUnseen ? prizes.length : 0 },
        ]}
      />
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
