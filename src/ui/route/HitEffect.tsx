import type { CSSProperties } from 'react'
import { typeGemSprite } from '../../data/items'
import { TYPE_INFO, type PokeType } from '../../data/types'
import './hit-effect.css'

/** Cómo se mueven las partículas del golpe */
type Motion = 'rise' | 'fall' | 'spin' | 'burst'

/** Movimiento de las partículas de cada tipo (las partículas son su gema y el color sale de TYPE_INFO) */
const TYPE_MOTION: Record<PokeType, Motion> = {
  normal: 'burst',
  fire: 'rise',
  water: 'fall',
  electric: 'burst',
  grass: 'spin',
  ice: 'fall',
  fighting: 'burst',
  poison: 'burst',
  ground: 'fall',
  flying: 'spin',
  psychic: 'rise',
  bug: 'spin',
  rock: 'fall',
  ghost: 'rise',
  dragon: 'spin',
  dark: 'burst',
  steel: 'burst',
  fairy: 'rise',
}

/** Destello y partículas del tipo del ataque sobre el Pokémon que lo recibe; se monta una vez por golpe */
export function HitEffect({ type }: { type: PokeType }) {
  const motion = TYPE_MOTION[type]
  const gem = <img src={typeGemSprite(type)} alt="" draggable={false} />
  return (
    <span className={`hit-fx fx-${motion}`} style={{ ['--fx-color' as string]: TYPE_INFO[type].color } as CSSProperties}>
      <i>{gem}</i>
      <i>{gem}</i>
      <i>{gem}</i>
    </span>
  )
}
