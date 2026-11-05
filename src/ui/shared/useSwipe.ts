import { useRef, type PointerEvent } from 'react'

/** Píxeles en horizontal que hay que deslizar el dedo para que cuente como pasar de página */
const SWIPE_MIN_PX = 50
/** Cuántas veces más horizontal que vertical tiene que ser el gesto, para no confundirlo con un toque torcido */
const SWIPE_RATIO = 1.5

interface SwipeHandlers {
  /** Gesto completado: 1 hacia la izquierda (siguiente), -1 hacia la derecha (anterior) */
  onSwipe: (step: 1 | -1) => void
  /** Mientras se arrastra: píxeles desplazados en horizontal (negativo, hacia la izquierda) */
  onDrag?: (dx: number) => void
  /** Se ha soltado sin llegar a pasar de página (o se ha cancelado el gesto) */
  onRelease?: () => void
}

/**
 * Deslizar a un lado u otro sobre un elemento (con el dedo o pinchando y arrastrando con el ratón). El elemento
 * captura el puntero, así que el gesto cuenta aunque el dedo acabe encima de otra cosa. Necesita
 * `touch-action: none` en su CSS.
 */
export function useSwipe({ onSwipe, onDrag, onRelease }: SwipeHandlers) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!e.isPrimary) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (start.current) onDrag?.(e.clientX - start.current.x)
  }
  const onPointerUp = (e: PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    start.current = null
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) onSwipe(dx < 0 ? 1 : -1)
    else onRelease?.()
  }
  const onPointerCancel = () => {
    start.current = null
    onRelease?.()
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
