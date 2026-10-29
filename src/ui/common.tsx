import { useState } from 'react'
import { move } from '../data/moves'
import { sprite } from '../data/species'
import { TYPE_INFO, type PokeType } from '../data/types'

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
  const src = fallback
    ? back ? sprite.back(id) : sprite.front(id)
    : back ? sprite.animatedBack(id) : sprite.animated(id)
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onError={() => setFallback(true)}
      className={`sprite ${silhouette ? 'silhouette' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
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

export function MoveChip({
  id,
  selected = false,
  onClick,
  disabled = false,
}: {
  id: string
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  const mv = move(id)
  return (
    <button
      className={`move-chip ${selected ? 'selected' : ''}`}
      style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="move-name">{mv.name}</span>
      <span className="move-meta">
        {TYPE_INFO[mv.type].name} · Pot. {mv.power}
      </span>
    </button>
  )
}

