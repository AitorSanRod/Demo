import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'

/** Multiplicadores de tiempo para probar sin esperar; el botón solo existe en desarrollo (npm run dev) */
const TIME_SCALES = [1, 10, 60]

/** Barra superior: nombre del juego y monedas */
export function TopBar({ game }: { game: GameState }) {
  return (
    <header className="top-bar">
      <span className="logo">Pokérancho</span>
      <span className="currency">₽ {game.money}</span>
      <span className="currency">🎟 {game.tickets}</span>
      {import.meta.env.DEV && <TimeScaleButton timeScale={game.timeScale} />}
    </header>
  )
}

function TimeScaleButton({ timeScale }: { timeScale: number }) {
  const cycle = () =>
    act((s) => {
      s.timeScale = TIME_SCALES[(TIME_SCALES.indexOf(s.timeScale) + 1) % TIME_SCALES.length]
    })
  return (
    <button className="time-chip" onClick={cycle} title="Velocidad del tiempo (solo en desarrollo)">
      ⏱ x{timeScale}
    </button>
  )
}
