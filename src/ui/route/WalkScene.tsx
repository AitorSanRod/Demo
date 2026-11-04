import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import type { Biome } from '../../data/maps'
import { Sprite } from '../shared/common'
import { PIXEL, pixelSceneFor, usePixelScene } from './pixelScene'
import { SCALE, svgSceneFor, type SceneLayer } from './scenery'
import './scene.css'

interface Floater {
  id: number
  x: number
  y: number
}

function layerStyle(l: SceneLayer, speed: number): CSSProperties {
  const w = l.w * SCALE
  return {
    backgroundImage: l.image,
    backgroundSize: `${w}px ${l.h * SCALE}px`,
    height: l.h * SCALE,
    [l.anchor]: l.offset * SCALE,
    ['--tile' as string]: `${w}px`,
    animationDuration: `${w / (l.speed * speed)}s`,
  }
}

/**
 * Escena de caminar: el Pokémon avanza hacia la derecha mientras el paisaje se desplaza en parallax. Los biomas con
 * escena pixel art (`pixelScene/`) se pintan en dos lienzos animados; el resto, con las capas SVG de `scenery/`.
 * `speed` multiplica la velocidad del scroll (Pokémon más rápidos = paisaje más rápido). `children` se pinta
 * sobre el suelo (p. ej. el combate) y puede usar `--ground` para colocarse a la altura del Pokémon. Sin `speciesId` no
 * camina nadie (p. ej. en la pelea contra un jefe comunitario, que pinta a los suyos).
 */
export function WalkScene({
  biome,
  speciesId,
  moving,
  speed,
  walkerClass = '',
  onStep,
  children,
}: {
  biome: Biome
  speciesId?: number
  moving: boolean
  speed: number
  /** Animación del Pokémon (p. ej. al atacar en un combate) */
  walkerClass?: string
  onStep?: () => void
  children?: ReactNode
}) {
  const pixelScene = pixelSceneFor(biome)
  const svgScene = pixelScene ? undefined : svgSceneFor(biome)
  const { container, back, front } = usePixelScene(pixelScene, moving, speed, PIXEL)
  const ground = pixelScene ? pixelScene.walkerBottom * PIXEL : (svgScene?.walkerBottom ?? 0) * SCALE
  const svgLayers = (layers: SceneLayer[] = []) =>
    layers.map((l, i) => <div key={i} className="scene-layer" style={layerStyle(l, speed)} />)
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
      className={`scene ${moving ? '' : 'paused'} ${svgScene?.surf ? 'surf' : ''}`}
      style={{ background: svgScene?.sky, ['--ground' as string]: `${ground}px` }}
      onPointerDown={onPointerDown}
    >
      {pixelScene && <canvas ref={back} className="scene-canvas" />}
      {svgLayers(svgScene?.back)}
      {speciesId !== undefined && (
        <div className={`scene-walker ${walkerClass}`}>
          <div className="scene-shadow" />
          <Sprite id={speciesId} size={128} />
        </div>
      )}
      {pixelScene && <canvas ref={front} className="scene-canvas front" />}
      {svgLayers(svgScene?.front)}
      {children}
      {floaters.map((f) => (
        <span key={f.id} className="floater" style={{ left: f.x, top: f.y }}>
          »
        </span>
      ))}
    </div>
  )
}
