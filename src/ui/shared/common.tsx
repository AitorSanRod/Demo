import { useState } from 'react'
import { move } from '../../data/moves'
import { sprite } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'

/**
 * Lienzo de referencia de los sprites: los PNG miden 96×96 y los GIF animados están recortados de ese mismo lienzo,
 * así que dibujar cada imagen a su tamaño real × (size / 96) mantiene la escala entre Pokémon.
 */
const SPRITE_CANVAS = 96

/**
 * Sprite de un Pokémon en una caja de size×size: la imagen va a escala (un Koffing es más pequeño que un Onix),
 * centrada y apoyada en el borde de abajo; los Pokémon grandes pueden sobresalir de la caja.
 */
export function Sprite({
  id,
  back = false,
  animated = true,
  size = 96,
  className = '',
  silhouette = false,
}: {
  id: number
  back?: boolean
  animated?: boolean
  size?: number
  className?: string
  silhouette?: boolean
}) {
  // Si el GIF animado no existe o falla, se usa el sprite estático
  const [fallback, setFallback] = useState(!animated)
  // Tamaño real de la imagen cargada; hasta saberlo no se muestra, para que no salte de tamaño
  const [natural, setNatural] = useState<{ src: string; w: number; h: number } | null>(null)
  const src = fallback
    ? back ? sprite.back(id) : sprite.front(id)
    : back ? sprite.animatedBack(id) : sprite.animated(id)
  const scale = size / SPRITE_CANVAS
  const loaded = natural?.src === src ? natural : null

  return (
    <span className={`sprite ${silhouette ? 'silhouette' : ''} ${className}`} style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => setFallback(true)}
        onLoad={(e) => setNatural({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        style={loaded ? { width: loaded.w * scale, height: loaded.h * scale } : { visibility: 'hidden' }}
      />
    </span>
  )
}

export function Bar({ value, max, kind }: { value: number; max: number; kind: 'hp' | 'exp' | 'steps' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const tone = kind !== 'hp' ? kind : pct > 50 ? 'hp-ok' : pct > 20 ? 'hp-mid' : 'hp-low'
  return (
    <div className="bar">
      <div className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function TypeBadge({ type }: { type: PokeType }) {
  return (
    <span className="type-badge" style={{ background: TYPE_INFO[type].color }}>
      {TYPE_INFO[type].name}
    </span>
  )
}

/** Ficha de un movimiento (solo informativa: cada Pokémon tiene un único ataque fijo) */
export function MoveChip({ id }: { id: string }) {
  const mv = move(id)
  return (
    <div className="move-chip" style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}>
      <span className="move-name">{mv.name}</span>
      <span className="move-meta">
        {TYPE_INFO[mv.type].name} · Pot. {mv.power}
      </span>
    </div>
  )
}

