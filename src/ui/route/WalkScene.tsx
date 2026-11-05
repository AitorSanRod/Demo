import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { Biome } from '../../data/maps'
import { Sprite } from '../shared/common'
import { PIXEL, pixelSceneFor, usePixelScene, type SceneLandmark } from './pixelScene'
import './scene.css'

interface Floater {
  id: number
  x: number
  y: number
}

/**
 * Escena de caminar: el Pokémon avanza hacia la derecha mientras el paisaje pixel art del bioma (`pixelScene/`) se
 * desplaza en parallax, pintado en dos lienzos animados (detrás y delante del Pokémon).
 * `speed` multiplica la velocidad del scroll (Pokémon más rápidos = paisaje más rápido). `children` se pinta
 * sobre el suelo (p. ej. el combate) y puede usar `--ground` para colocarse a la altura del Pokémon. Sin `speciesId` no
 * camina nadie (p. ej. en la pelea contra un jefe comunitario, que pinta a los suyos). `landmark`: elemento de la
 * parada a la que se acerca o en la que está (cartel, casa…), que entra una vez por parada.
 */
export function WalkScene({
  biome,
  speciesId,
  moving,
  speed,
  walkerClass = '',
  onStep,
  landmark = null,
  children,
}: {
  biome: Biome
  speciesId?: number
  moving: boolean
  speed: number
  /** Animación del Pokémon (p. ej. al atacar en un combate) */
  walkerClass?: string
  onStep?: () => void
  landmark?: SceneLandmark | null
  children?: ReactNode
}) {
  const scene = pixelSceneFor(biome)
  const { container, back, front } = usePixelScene(scene, moving, speed, PIXEL, landmark)
  const ground = scene.walkerBottom * PIXEL
  const [floaters, setFloaters] = useState<Floater[]>([])
  const nextId = useRef(0)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!onStep) return
    onStep()
    navigator.vibrate?.(8)
    const rect = e.currentTarget.getBoundingClientRect()
    const f = { id: nextId.current++, x: e.clientX - rect.left, y: e.clientY - rect.top }
    setFloaters((fs) => [...fs.slice(-8), f])
    setTimeout(() => setFloaters((fs) => fs.filter((x) => x.id !== f.id)), 700)
  }

  return (
    <div
      ref={container}
      className={`scene ${moving ? '' : 'paused'} ${scene.surf ? 'surf' : ''}`}
      style={{ ['--ground' as string]: `${ground}px` }}
      onPointerDown={onPointerDown}
    >
      <canvas ref={back} className="scene-canvas" />
      {speciesId !== undefined && (
        <div className={`scene-walker ${walkerClass}`}>
          <div className="scene-shadow" />
          <Sprite id={speciesId} size={128} />
        </div>
      )}
      <canvas ref={front} className="scene-canvas front" />
      {children}
      {floaters.map((f) => (
        <span key={f.id} className="floater" style={{ left: f.x, top: f.y }}>
          »
        </span>
      ))}
    </div>
  )
}
