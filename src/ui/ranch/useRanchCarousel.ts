import { useState, type CSSProperties, type TransitionEvent } from 'react'
import { useSwipe } from '../shared/useSwipe'

/**
 * Cómo se mueve la tira de ranchos: `idle` quieta (sin transform, para no crear capa encima de los botones), `drag`
 * siguiendo al dedo y `settle` deslizándose sola hasta el rancho de al lado (`step`) o de vuelta al suyo (step 0)
 */
type Phase = { kind: 'idle' } | { kind: 'drag'; dx: number } | { kind: 'settle'; step: -1 | 0 | 1 }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Desplazamiento de la tira: un rancho entero más el hueco que los separa (ver .ranch-track en ranch.css) */
const pageShift = (step: number) => `calc(${-step} * (100% + var(--ranch-gap)))`

/**
 * Pasar de rancho como en una galería de fotos: la imagen sigue al dedo, se ve llegar la de al lado y al soltar se
 * completa el paso (o vuelve a su sitio). Las flechas hacen el mismo deslizamiento. `neighbor` es el rancho que se
 * asoma (null si no se mueve nada)
 */
export function useRanchCarousel(count: number, ranch: number, setRanch: (ranch: number) => void) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const at = (step: number) => (ranch + step + count) % count

  const turn = (step: 1 | -1) => {
    if (count < 2 || phase.kind === 'settle') return
    if (reducedMotion()) return setRanch(at(step))
    setPhase({ kind: 'settle', step })
  }
  const swipe = useSwipe({
    onSwipe: turn,
    onDrag: (dx) => count > 1 && phase.kind !== 'settle' && setPhase({ kind: 'drag', dx }),
    // Sin apenas moverse (o sin animaciones) no hay nada que deslizar de vuelta: no llegaría el fin de la transición
    onRelease: () => phase.kind === 'drag' && setPhase(reducedMotion() || Math.abs(phase.dx) < 1 ? { kind: 'idle' } : { kind: 'settle', step: 0 }),
  })
  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget || phase.kind !== 'settle') return
    if (phase.step !== 0) setRanch(at(phase.step))
    setPhase({ kind: 'idle' })
  }

  const direction = phase.kind === 'settle' ? phase.step : phase.kind === 'drag' ? -Math.sign(phase.dx) : 0
  const neighbor = direction === 0 ? null : { ranch: at(direction), side: direction }
  const style: CSSProperties | undefined =
    phase.kind === 'drag'
      ? { transform: `translateX(${phase.dx}px)` }
      : phase.kind === 'settle'
        ? { transform: `translateX(${pageShift(phase.step)})` }
        : undefined

  return { turn, swipe, neighbor, settling: phase.kind === 'settle', trackProps: { style, onTransitionEnd } }
}

/** Dónde se coloca el rancho que se asoma: a la derecha (siguiente) o a la izquierda (anterior), tras el hueco */
export const neighborStyle = (side: number): CSSProperties => ({ transform: `translateX(${pageShift(-side)})` })
