import { createPortal } from 'react-dom'
import { Sprite } from './common'
import './overlays.css'

/**
 * Aparición de un solo Pokémon sobre fondo oscuro: título, su imagen y su nombre. Tocar en cualquier parte cierra.
 * Se pinta en <body> para que nada de la pantalla (fichas pegadas, bocadillos del tutorial) quede por encima.
 */
export function RevealOverlay({
  title,
  speciesId,
  name,
  detail,
  color,
  onClose,
}: {
  title: string
  speciesId: number
  name: string
  detail?: string
  /** Color del halo de detrás (el de su rareza) */
  color: string
  onClose: () => void
}) {
  return createPortal(
    <div className="reward-overlay reveal-overlay" onClick={onClose} style={{ ['--reward' as string]: color }}>
      <h2 className="reward-title">{title}</h2>
      <div className="reveal-mon">
        <Sprite id={speciesId} size={160} />
      </div>
      <strong className="reveal-name">{name}</strong>
      {detail && <span className="small">{detail}</span>}
      <span className="reward-hint small">Toca para continuar</span>
    </div>,
    document.body,
  )
}
