import type { ReactNode } from 'react'
import { MAX_STARS } from '../../../game/team/stats'
import './hero.css'

interface Props {
  /** Paisaje de fondo; null para el fondo neutro de una especie sin descubrir */
  scenery: string | null
  name: string
  /** Debajo del nombre: el nivel o un aviso */
  subtitle?: ReactNode
  /** Estrellas conseguidas; sin ellas no se pinta la fila */
  stars?: number
  /** Escenario central: el Pokémon y, si toca, su arco de EXP */
  children: ReactNode
  footer?: ReactNode
  /** Versión más baja, para diálogos */
  compact?: boolean
}

/** Cabecera de una ficha a pantalla completa: paisaje, nombre, subtítulo, ★ y el Pokémon en el centro */
export function HeroLayout({ scenery, name, subtitle, stars, children, footer, compact = false }: Props) {
  return (
    <div className={`mon-hero ${scenery ? '' : 'unknown'} ${compact ? 'compact' : ''}`} style={scenery ? { backgroundImage: `url(${scenery})` } : undefined}>
      <div className="mon-hero-title">
        <h1>{name}</h1>
        {subtitle && <span className="mon-hero-level">{subtitle}</span>}
        {stars !== undefined && (
          <span className="mon-hero-stars" aria-label={`${stars} de ${MAX_STARS} estrellas`}>
            {Array.from({ length: MAX_STARS }, (_, i) => (
              <span key={i} className={i < stars ? 'on' : ''}>
                ★
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="mon-hero-stage">{children}</div>
      {footer && <div className="mon-hero-hp">{footer}</div>}
    </div>
  )
}

/** Radio del arco de EXP en unidades del SVG; el Pokémon queda dentro, apoyado en su base */
const ARC_R = 100
const ARC = `M 10 ${ARC_R + 10} A ${ARC_R} ${ARC_R} 0 0 1 ${2 * ARC_R + 10} ${ARC_R + 10}`

/**
 * Arco de EXP sobre el Pokémon: `progress` en blanco y, si hay `preview`, hasta dónde llegaría en amarillo. Con
 * `previewTip` el punto del extremo marca el final de la vista previa en vez del de la EXP actual.
 */
export function ExpArc({ progress, preview = null, previewTip = false, label }: { progress: number; preview?: number | null; previewTip?: boolean; label: string }) {
  // Punto del arco donde acaba la EXP: de izquierda (π) a derecha (0)
  const angle = Math.PI * (1 - (previewTip && preview !== null ? preview : progress))
  const tip = { x: ARC_R + 10 + ARC_R * Math.cos(angle), y: ARC_R + 10 - ARC_R * Math.sin(angle) }
  return (
    <svg className="mon-exp-arc" viewBox={`0 0 ${2 * ARC_R + 20} ${ARC_R + 20}`} aria-label={label}>
      <path d={ARC} className="track" pathLength={1} />
      {preview !== null && <path d={ARC} className="preview" pathLength={1} strokeDasharray={`${preview} 1`} />}
      <path d={ARC} className="fill" pathLength={1} strokeDasharray={`${progress} 1`} />
      <circle cx={tip.x} cy={tip.y} r={6} className={`tip ${previewTip ? 'preview' : ''}`} />
    </svg>
  )
}
