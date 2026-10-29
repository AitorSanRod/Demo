import { useEffect, useState } from 'react'
import { tick } from './game/engine'
import { isExpeditionDone } from './game/expedition'
import { combinableCount } from './game/pieces'
import { act, useGame } from './game/store'
import { DexScreen } from './ui/DexScreen'
import { ExpeditionScreen } from './ui/ExpeditionScreen'
import { GachaScreen } from './ui/GachaScreen'
import { RanchScreen } from './ui/RanchScreen'
import { RouteScreen } from './ui/RouteScreen'
import { StarterScreen } from './ui/StarterScreen'

type Tab = 'route' | 'ranch' | 'expeditions' | 'gacha' | 'dex'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'route', icon: '🗺️', label: 'Ruta' },
  { id: 'ranch', icon: '🏡', label: 'Rancho' },
  { id: 'expeditions', icon: '🧭', label: 'Expediciones' },
  { id: 'gacha', icon: '🎰', label: 'Gacha' },
  { id: 'dex', icon: '📕', label: 'Pokédex' },
]
const TIME_SCALES = [1, 10, 60]
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

  const cycleTimeScale = () =>
    act((s) => {
      s.timeScale = TIME_SCALES[(TIME_SCALES.indexOf(s.timeScale) + 1) % TIME_SCALES.length]
    })

  const badges: Record<Tab, boolean> = {
    route: !!game.run && game.run.phase !== 'walking',
    ranch: false,
    expeditions: game.expeditions.some(isExpeditionDone),
    gacha: false,
    dex: combinableCount(game) > 0,
  }

  if (game.owned.length === 0) {
    return (
      <div className="app">
        <StarterScreen />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="top-bar">
        <span className="logo">Pokérancho</span>
        <span className="currency">₽ {game.money}</span>
        <span className="currency">🎟 {game.tickets}</span>
        <button className="time-chip" onClick={cycleTimeScale} title="Velocidad del tiempo (demo)">
          ⏱ x{game.timeScale}
        </button>
      </header>

      <main className="content">
        {tab === 'route' && <RouteScreen game={game} />}
        {tab === 'ranch' && <RanchScreen game={game} />}
        {tab === 'expeditions' && <ExpeditionScreen game={game} />}
        {tab === 'gacha' && <GachaScreen game={game} />}
        {tab === 'dex' && <DexScreen game={game} />}
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
