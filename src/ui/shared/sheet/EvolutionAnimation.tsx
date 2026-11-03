import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Sprite } from '../common'
import './evolution-animation.css'
import './evolution-swap.css'

/** Milisegundos de brillo y transformación antes del fogonazo que revela al Pokémon */
const MORPH_MS = 3200
/** Tamaño del Pokémon en la animación */
const SPRITE_PX = 200
/** Destellos que suben alrededor del Pokémon mientras brilla */
const SPARKLES = 14

interface Props {
  /** Pokémon que llega o en el que se convierte */
  intoId: number
  /** Si evoluciona, el de antes: empieza en color, se vuelve luz y alterna con la evolución. Sin él, sale de su silueta de luz */
  fromId?: number
  title: string
  name: string
  detail?: string
  /** Color del halo final (el de su rareza) */
  color: string
  onClose: () => void
}

/**
 * Aparición o evolución al estilo de los juegos: fondo oscuro, haces de luz, destellos, el Pokémon brillando en blanco y
 * un fogonazo que lo revela en color. Tocar durante la transformación la salta; después, cierra.
 */
export function EvolutionAnimation({ intoId, fromId, title, name, detail, color, onClose }: Props) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [revealed, setRevealed] = useState(reduced)

  useEffect(() => {
    if (revealed) return
    const timer = window.setTimeout(() => setRevealed(true), MORPH_MS)
    return () => window.clearTimeout(timer)
  }, [revealed])

  return createPortal(
    <div
      className={`evo-overlay ${revealed ? 'revealed' : 'morphing'} ${fromId ? 'evolving' : ''}`}
      style={{ ['--evo-color' as string]: color, ['--morph-ms' as string]: `${MORPH_MS}ms` }}
      onClick={revealed ? onClose : () => setRevealed(true)}
    >
      <div className="evo-rays" />
      <div className="evo-stage">
        {!revealed && (
          <>
            <span className="evo-glow from">
              <Sprite id={fromId ?? intoId} size={SPRITE_PX} animated={false} />
            </span>
            {fromId && (
              <span className="evo-glow into">
                <Sprite id={intoId} size={SPRITE_PX} animated={false} />
              </span>
            )}
            {Array.from({ length: SPARKLES }, (_, i) => (
              <i key={i} className="evo-sparkle" style={sparkleStyle(i)} />
            ))}
          </>
        )}
        {revealed && (
          <span className="evo-final">
            <Sprite id={intoId} size={SPRITE_PX} />
          </span>
        )}
      </div>
      {revealed && (
        <div className="evo-text">
          <h2 className="reward-title">{title}</h2>
          <strong className="reveal-name">{name}</strong>
          {detail && <span className="small">{detail}</span>}
          <span className="reward-hint small">Toca para continuar</span>
        </div>
      )}
      {revealed && !reduced && <div className="evo-flash" />}
    </div>,
    document.body,
  )
}

/** Cada destello sale de un punto distinto alrededor del Pokémon y con su propio retraso */
function sparkleStyle(i: number): CSSProperties {
  const angle = (i / SPARKLES) * Math.PI * 2
  return {
    ['--x' as string]: `${Math.cos(angle) * 90}px`,
    ['--y' as string]: `${Math.sin(angle) * 50 + 30}px`,
    animationDelay: `${(i * 0.37) % 2.4}s`,
  }
}
