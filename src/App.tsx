import { useEffect, useState } from 'react'
import type { Item } from './data/items'
import { combinableIds } from './game/collection/pieces'
import { TutorialStep } from './game/core/state'
import { startAccount } from './net/account'
import { startCloudSync } from './net/cloudSync'
import { startPush } from './net/push'
import { startRaidFeed } from './net/raidFeed'
import { startRaidSync } from './net/raidSync'
import { AccountHost } from './ui/account/AccountHost'
import { act, useGame } from './game/core/store'
import { tick } from './game/core/tick'
import { isExpeditionDone } from './game/team/expedition'
import { DexScreen } from './ui/dex/DexScreen'
import { GachaScreen } from './ui/gacha/GachaScreen'
import { RanchScreen } from './ui/ranch/RanchScreen'
import { RouteScreen } from './ui/route/RouteScreen'
import { TopBar } from './ui/shared/TopBar'
import { TutorialNavHint } from './ui/shared/TutorialHint'
import { UpgradeShop } from './ui/shop/UpgradeShop'
import { StarterScreen } from './ui/starter/StarterScreen'
import { ICON } from './ui/shared/icons'
import { ItemIcon } from './ui/shared/ItemIcon'
import { pendingKey, useUnseen } from './ui/shared/useUnseen'

type Tab = 'route' | 'ranch' | 'shop' | 'gacha' | 'dex'

const TABS: { id: Tab; icon: Item; label: string }[] = [
  { id: 'route', icon: ICON.Route, label: 'Ruta' },
  { id: 'gacha', icon: ICON.Gacha, label: 'Gacha' },
  { id: 'ranch', icon: ICON.Ranch, label: 'Rancho' },
  { id: 'shop', icon: ICON.Shop, label: 'Tienda' },
  { id: 'dex', icon: ICON.Dex, label: 'Pokédex' },
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
  // Salas compartidas de los jefes comunitarios: entrar, ponerse al día y avisar al salir
  useEffect(startRaidSync, [])
  useEffect(startRaidFeed, [])
  // Notificaciones push: el plan de avisos al ocultarse la app y la suscripción al día con la cuenta
  useEffect(startPush, [])
  // Cuenta opcional: sesión, enlaces de los correos y partida en la nube
  useEffect(() => {
    void startAccount()
    return startCloudSync()
  }, [])

  // Los puntos rojos se apagan al entrar en la pestaña y vuelven si aparece algo nuevo
  const runNeedsLook = game.run && game.run.phase !== 'walking' ? [`${game.run.routeId}:${game.run.phase}`] : []
  const routePending = pendingKey([...runNeedsLook, ...game.expeditions.filter(isExpeditionDone).map((e) => e.uid)])
  const badges: Record<Tab, boolean> = {
    route: useUnseen('tab:route', routePending, tab === 'route'),
    ranch: false,
    shop: false,
    gacha: false,
    dex: useUnseen('tab:dex', pendingKey(combinableIds(game)), tab === 'dex'),
  }

  if (game.tutorial === TutorialStep.Starter) {
    return (
      <div className="app">
        <StarterScreen />
        <AccountHost game={game} />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar game={game} />
      <AccountHost game={game} />

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
              <ItemIcon item={t.icon} size={30} off={tab !== t.id} />
              {badges[t.id] && <span className="dot" />}
            </span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
