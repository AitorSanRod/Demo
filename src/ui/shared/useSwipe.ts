import { useRef, type PointerEvent } from 'react'

/** Píxeles en horizontal que hay que deslizar el dedo para que cuente como pasar de página */
const SWIPE_MIN_PX = 50
/** Cuántas veces más horizontal que vertical tiene que ser el gesto, para no confundirlo con un toque torcido */
const SWIPE_RATIO = 1.5

/**
 * Deslizar a un lado u otro sobre un elemento (con el dedo o pinchando y arrastrando con el ratón): `onSwipe(1)`
 * hacia la izquierda (siguiente) y `onSwipe(-1)` hacia la derecha (anterior). El elemento captura el puntero, así
 * que el gesto cuenta aunque el dedo acabe encima de otra cosa. Necesita `touch-action: none` en su CSS.
 */
export function useSwipe(onSwipe: (step: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!e.isPrimary) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    start.current = null
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) onSwipe(dx < 0 ? 1 : -1)
  }
  const onPointerCancel = () => {
    start.current = null
  }

  return { onPointerDown, onPointerUp, onPointerCancel }
}
