import type { ReactNode } from 'react'
import type { Item } from '../../../data/items'
import type { Stats } from '../../../game/team/stats'
import { ItemIcon } from '../ItemIcon'
import './mon-sheet.css'

interface MonSheetProps {
  label: string
  hero: ReactNode
  /** Botón sobre la esquina superior derecha de la cabecera (el corazón de favorito) */
  heroCorner?: ReactNode
  children: ReactNode
  onClose: () => void
}

/**
 * Ficha a pantalla completa (rancho y Pokédex): la cabecera arriba, el contenido debajo y un botón redondo ✕ abajo
 * en el centro, siempre a la vista. Cubre la zona de contenido; el menú inferior sigue visible.
 */
export function MonSheet({ label, hero, heroCorner, children, onClose }: MonSheetProps) {
  return (
    <div className="mon-screen" role="dialog" aria-modal="true" aria-label={label}>
      <div className="mon-screen-top">
        {hero}
        {heroCorner && <div className="mon-hero-corner">{heroCorner}</div>}
      </div>
      <div className="mon-card">{children}</div>
      <button className="mon-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}

/** Bloque con título de la ficha: las dos fichas ordenan su contenido en las mismas secciones */
export function MonSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mon-section">
      <h3 className="mon-section-title">{title}</h3>
      {children}
    </section>
  )
}

export function MonStats({ stats, stepsPerMin }: { stats: Stats; stepsPerMin: number }) {
  const items: [string, number][] = [
    ['PS', stats.hp],
    ['Ataque', stats.atk],
    ['Defensa', stats.def],
    ['Velocidad', stats.spe],
    ['Pasos/min', stepsPerMin],
  ]
  return (
    <div className="mon-stats">
      {items.map(([label, value]) => (
        <div key={label} className="mon-stat">
          <strong>{value}</strong>
          <span className="tiny muted">{label}</span>
        </div>
      ))}
    </div>
  )
}

interface BigActionProps {
  icon: Item
  label: string
  price?: number
  /** Moneda del precio; sin ella, pokécuartos (₽) */
  priceIcon?: Item
  disabled?: boolean
  /** Icono en gris aunque el botón funcione (p. ej. un interruptor apagado) */
  iconOff?: boolean
  className?: string
  onClick: () => void
}

/** Botón ancho de acción de la ficha: icono a la izquierda, texto y precio a la derecha */
export function BigAction({ icon, label, price, priceIcon, disabled = false, iconOff = false, className = '', onClick }: BigActionProps) {
  return (
    <button className={`btn big-action ${className}`} disabled={disabled} onClick={onClick}>
      <ItemIcon item={icon} size={36} off={disabled || iconOff} />
      <span className="grow">{label}</span>
      {price !== undefined && (
        <span className="big-action-price with-icon">
          {priceIcon ? <ItemIcon item={priceIcon} size={18} /> : '₽'} {price}
        </span>
      )}
    </button>
  )
}
