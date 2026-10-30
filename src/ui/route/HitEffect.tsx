import type { CSSProperties } from 'react'
import { TYPE_INFO, type PokeType } from '../../data/types'
import './hit-effect.css'

/** Cómo se mueven las partículas del golpe */
type Motion = 'rise' | 'fall' | 'spin' | 'burst'

/** Aspecto del golpe de cada tipo: emoji de las partículas y movimiento (el color sale de TYPE_INFO) */
const TYPE_FX: Record<PokeType, { emoji: string; motion: Motion }> = {
  normal: { emoji: '💥', motion: 'burst' },
  fire: { emoji: '🔥', motion: 'rise' },
  water: { emoji: '💧', motion: 'fall' },
  electric: { emoji: '⚡', motion: 'burst' },
  grass: { emoji: '🍃', motion: 'spin' },
  ice: { emoji: '❄️', motion: 'fall' },
  fighting: { emoji: '👊', motion: 'burst' },
  poison: { emoji: '☠️', motion: 'burst' },
  ground: { emoji: '🟫', motion: 'fall' },
  flying: { emoji: '🌪️', motion: 'spin' },
  psychic: { emoji: '🔮', motion: 'rise' },
  bug: { emoji: '🐛', motion: 'spin' },
  rock: { emoji: '🪨', motion: 'fall' },
  ghost: { emoji: '👻', motion: 'rise' },
  dragon: { emoji: '🐉', motion: 'spin' },
  dark: { emoji: '🌑', motion: 'burst' },
  steel: { emoji: '⚙️', motion: 'burst' },
  fairy: { emoji: '✨', motion: 'rise' },
}

/** Destello y partículas del tipo del ataque sobre el Pokémon que lo recibe; se monta una vez por golpe */
export function HitEffect({ type }: { type: PokeType }) {
  const { emoji, motion } = TYPE_FX[type]
  return (
    <span className={`hit-fx fx-${motion}`} style={{ ['--fx-color' as string]: TYPE_INFO[type].color } as CSSProperties}>
      <i>{emoji}</i>
      <i>{emoji}</i>
      <i>{emoji}</i>
    </span>
  )
}
