import { useEffect, useRef } from 'react'
import { SceneRenderer } from './engine/renderer'
import type { SceneDef } from './engine/types'

/** Paso máximo de una animación, en segundos (evita saltos al volver de otra pestaña) */
const MAX_STEP = 0.1

/**
 * Anima una escena pixel art en dos lienzos (detrás y delante del Pokémon) que llenan `container`.
 * `pixel`: píxeles de pantalla por píxel de arte. Sin `scene` no hace nada.
 */
export function usePixelScene(scene: SceneDef | undefined, moving: boolean, speed: number, pixel: number) {
  const container = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLCanvasElement>(null)
  const front = useRef<HTMLCanvasElement>(null)
  const motion = useRef({ moving, speed })

  useEffect(() => {
    motion.current = { moving, speed }
  }, [moving, speed])

  useEffect(() => {
    if (!scene || !container.current || !back.current || !front.current) return
    const box = container.current
    const canvases = [back.current, front.current]
    const renderer = new SceneRenderer(scene, back.current, front.current)
    const resize = () => {
      const width = Math.ceil(box.clientWidth / pixel)
      const height = Math.ceil(box.clientHeight / pixel)
      renderer.resize(width, height)
      for (const canvas of canvases) Object.assign(canvas.style, { width: `${width * pixel}px`, height: `${height * pixel}px` })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(box)
    resize()
    let last = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      Object.assign(renderer, motion.current)
      renderer.update(Math.min(MAX_STEP, Math.max(0, (now - last) / 1000)))
      renderer.draw()
      last = now
      frame = requestAnimationFrame(step)
    })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [scene, pixel])

  return { container, back, front }
}
