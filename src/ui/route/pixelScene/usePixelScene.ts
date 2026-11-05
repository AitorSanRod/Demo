import { useEffect, useRef } from 'react'
import { SceneRenderer } from './engine/renderer'
import type { SceneDef } from './engine/types'

/** Paso máximo de una animación, en segundos (evita saltos al volver de otra pestaña) */
const MAX_STEP = 0.1

/** Elemento de parada que debe entrar en la escena; `key` cambia una vez por parada para que entre una sola vez */
export interface SceneLandmark {
  key: string
  id: string
}

/**
 * Anima una escena pixel art en dos lienzos (detrás y delante del Pokémon) que llenan `container`.
 * `pixel`: píxeles de pantalla por píxel de arte. Cada `landmark` nuevo entra por la derecha (o aparece ya colocado si
 * el Pokémon está parado).
 */
export function usePixelScene(scene: SceneDef, moving: boolean, speed: number, pixel: number, landmark: SceneLandmark | null = null) {
  const container = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLCanvasElement>(null)
  const front = useRef<HTMLCanvasElement>(null)
  const motion = useRef({ moving, speed })
  const renderer = useRef<SceneRenderer | null>(null)
  const shown = useRef<string | null>(null)
  const pending = useRef(landmark)

  useEffect(() => {
    motion.current = { moving, speed }
  }, [moving, speed])

  useEffect(() => {
    pending.current = landmark
    if (landmark && renderer.current && shown.current !== landmark.key) {
      shown.current = landmark.key
      renderer.current.spawnLandmark(landmark.id, !motion.current.moving)
    }
  }, [landmark])

  useEffect(() => {
    if (!container.current || !back.current || !front.current) return
    const box = container.current
    const canvases = [back.current, front.current]
    const scenery = new SceneRenderer(scene, back.current, front.current)
    renderer.current = scenery
    const resize = () => {
      const width = Math.ceil(box.clientWidth / pixel)
      const height = Math.ceil(box.clientHeight / pixel)
      scenery.resize(width, height)
      for (const canvas of canvases) Object.assign(canvas.style, { width: `${width * pixel}px`, height: `${height * pixel}px` })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(box)
    resize()
    const first = pending.current
    shown.current = first?.key ?? null
    if (first) scenery.spawnLandmark(first.id, !motion.current.moving)
    let last = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      Object.assign(scenery, motion.current)
      scenery.update(Math.min(MAX_STEP, Math.max(0, (now - last) / 1000)))
      scenery.draw()
      last = now
      frame = requestAnimationFrame(step)
    })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.current = null
    }
  }, [scene, pixel])

  return { container, back, front }
}
