import { useEffect, useState } from 'react'
import { tick } from './game/engine'
import { act, useGame } from './game/store'
import { DexScreen } from './ui/DexScreen'
import { GachaScreen } from './ui/GachaScreen'
import { RanchScreen } from './ui/RanchScreen'
import { RouteScreen } from './ui/RouteScreen'
import { StarterScreen } from './ui/StarterScreen'

type Tab = 'route' | 'ranch' | 'gacha' | 'dex'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'route', icon: '🗺️', label: 'Ruta' },
  { id: 'ranch', icon: '🏡', label: 'Rancho' },
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

  // Las recompensas se aplican al llegar al nodo; no se muestran hasta ver el combate
  const pending = game.run?.phase === 'battle' ? game.run.battle?.rewards : undefined
  const money = game.money - (pending?.money ?? 0) + (pending?.moneyLost ?? 0)
  const tickets = game.tickets - (pending?.tickets ?? 0)

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
        <span className="currency">₽ {money}</span>
        <span className="currency">🎟 {tickets}</span>
        <button className="time-chip" onClick={cycleTimeScale} title="Velocidad del tiempo (demo)">
          ⏱ x{game.timeScale}
        </button>
      </header>

      <main className="content">
        {tab === 'route' && <RouteScreen game={game} onFainted={() => setTab('ranch')} />}
        {tab === 'ranch' && <RanchScreen game={game} />}
        {tab === 'gacha' && <GachaScreen game={game} />}
        {tab === 'dex' && <DexScreen game={game} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="nav-icon">
              {t.icon}
              {t.id === 'route' && game.run && game.run.phase !== 'walking' && <span className="dot" />}
            </span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
