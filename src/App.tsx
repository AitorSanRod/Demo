import { useEffect, useState } from 'react'
import { combinableCount } from './game/collection/pieces'
import { TutorialStep } from './game/core/state'
import { act, useGame } from './game/core/store'
import { tick } from './game/core/tick'
import { isExpeditionDone } from './game/team/expedition'
import { DexScreen } from './ui/dex/DexScreen'
import { GachaScreen } from './ui/gacha/GachaScreen'
import { RanchScreen } from './ui/ranch/RanchScreen'
import { RouteScreen } from './ui/route/RouteScreen'
import { useExpeditionNotifications } from './ui/settings/notifications'
import { TopBar } from './ui/shared/TopBar'
import { TutorialNavHint } from './ui/shared/TutorialHint'
import { UpgradeShop } from './ui/shop/UpgradeShop'
import { StarterScreen } from './ui/starter/StarterScreen'

type Tab = 'route' | 'ranch' | 'shop' | 'gacha' | 'dex'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'route', icon: '🗺️', label: 'Ruta' },
  { id: 'ranch', icon: '🏡', label: 'Rancho' },
  { id: 'shop', icon: '🛒', label: 'Tienda' },
  { id: 'gacha', icon: '🎰', label: 'Gacha' },
  { id: 'dex', icon: '📕', label: 'Pokédex' },
]
const TICK_MS = 250

export default function App() {
  const game = useGame()
  const [tab, setTab] = useState<Tab>(game.run ? 'route' : 'ranch')

  // Bucle de juego: el primer tick también aplica el progreso hecho con la app cerrada
  useEffect(() => {
    act((s) => tick(s, Date.now()))
    const id = setInterval(() => act((s) => tick(s, Date.now())), TICK_MS)
    return () => clearInterval(id)
  }, [])
  useExpeditionNotifications(game)

  const badges: Record<Tab, boolean> = {
    route: (!!game.run && game.run.phase !== 'walking') || game.expeditions.some(isExpeditionDone),
    ranch: false,
    shop: false,
    gacha: false,
    dex: combinableCount(game) > 0,
  }

  if (game.tutorial === TutorialStep.Starter) {
    return (
      <div className="app">
        <StarterScreen />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar game={game} />

      <main className="content">
        {tab === 'route' && <RouteScreen game={game} />}
        {tab === 'ranch' && <RanchScreen game={game} />}
        {tab === 'shop' && <UpgradeShop game={game} />}
        {tab === 'gacha' && <GachaScreen game={game} />}
        {tab === 'dex' && <DexScreen game={game} />}
        <TutorialNavHint game={game} currentTab={tab} tabIds={TABS.map((t) => t.id)} />
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="nav-icon">
              {t.icon}
              {badges[t.id] && <span className="dot" />}
            </span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
