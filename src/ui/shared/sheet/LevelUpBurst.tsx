import type { CSSProperties } from 'react'
import './level-up.css'

/** Flechas que suben alrededor del Pokémon: posición horizontal (px desde el centro) y retraso (s) de cada una */
const ARROWS: [x: number, delay: number][] = [
  [-56, 0],
  [48, 0.08],
  [-24, 0.18],
  [20, 0.26],
  [-44, 0.34],
  [60, 0.4],
]

/** Destello dorado, anillo que se expande, flechas hacia arriba y «¡Nv. N!»; se monta una vez por nivel subido */
export function LevelUpBurst({ level }: { level: number }) {
  return (
    <span className="level-up" aria-hidden="true">
      <span className="level-up-flash" />
      <span className="level-up-ring" />
      {ARROWS.map(([x, delay], i) => (
        <i key={i} className="level-up-arrow" style={{ '--x': `${x}px`, animationDelay: `${delay}s` } as CSSProperties} />
      ))}
      <strong className="level-up-label">¡Nv. {level}!</strong>
    </span>
  )
}
