import type { AnimationEvent } from 'react'
import './capture.css'

/** Animaciones que terminan la captura: con caída (tirada desde el botón) o solo el balanceo (al tocar la Pokéball) */
const CAPTURE_ANIMATIONS = ['capture', 'capture-wobble']

/**
 * La Pokéball se balancea tres veces como en una captura y se abre sola; tocarla la abre antes. Si la tirada
 * se hizo desde el botón, primero cae. Mientras, el fondo se oscurece poco a poco hasta la pantalla de premios.
 */
export function CaptureBall({ glow, drop, onOpen }: { glow: string; drop: boolean; onOpen: () => void }) {
  const onAnimationEnd = (e: AnimationEvent) => {
    if (CAPTURE_ANIMATIONS.includes(e.animationName)) onOpen()
  }

  return (
    <div className={`capture ${drop ? '' : 'no-drop'}`}>
      <div className="capture-dim" />
      <button
        className="capture-ball"
        style={{ ['--glow' as string]: glow }}
        onClick={onOpen}
        onAnimationEnd={onAnimationEnd}
        aria-label="Abrir Pokéball"
      >
        <span className="pokeball" />
      </button>
      <span className="tiny capture-hint">Toca para abrirla ya</span>
    </div>
  )
}
