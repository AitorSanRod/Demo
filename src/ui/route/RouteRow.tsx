import type { ReactNode } from 'react'
import type { Route } from '../../data/maps'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './route.css'

interface BackdropRowProps {
  image?: string
  /** Qué franja de la imagen se ve, en % de su alto */
  focusY?: number
  className?: string
  /** Con `onClick`, la tarjeta entera es el botón (con una flecha a la derecha) */
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
}

/**
 * Tarjeta de una línea sobre una imagen difuminada: base de las listas de rutas, de expediciones y de la sala de un
 * jefe. Si se puede tocar, es un botón entero en vez de llevar uno dentro, para que el texto tenga todo el ancho
 */
export function BackdropRow({ image, focusY = 50, className = '', onClick, disabled = false, children }: BackdropRowProps) {
  const backdrop = image && (
    <span className="route-backdrop" style={{ backgroundImage: `url(${image})`, backgroundPositionY: `${focusY}%` }} aria-hidden="true" />
  )
  if (!onClick) {
    return (
      <div className={`card route-row ${className}`}>
        {backdrop}
        {children}
      </div>
    )
  }
  return (
    <button type="button" className={`card route-row tappable ${className}`} disabled={disabled} onClick={onClick}>
      {backdrop}
      {children}
      <span className="route-go" aria-hidden="true" />
    </button>
  )
}

interface RouteRowProps {
  route: Route
  locked?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
}

/** Línea sobre la imagen de la zona de la ruta; bloqueada se ve apagada y no se puede tocar */
export function RouteRow({ route: r, locked = false, className = '', onClick, disabled, children }: RouteRowProps) {
  return (
    <BackdropRow
      image={r.backdrop?.image}
      focusY={r.backdrop?.focusY}
      className={`${locked ? 'locked' : ''} ${className}`}
      onClick={locked ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </BackdropRow>
  )
}

/** Nombre y niveles de la ruta, como los muestra cada línea */
export function RouteRowTitle({ route: r }: { route: Route }) {
  return (
    <>
      <strong className="grow">{r.name}</strong>
      <span className="small route-levels">
        Nv. {r.levels[0]}–{r.levels[1]}
      </span>
    </>
  )
}

/** Candado de una ruta en la que aún no se puede entrar; `reason`, por qué */
export function RouteLock({ reason = 'Completa la ruta anterior' }: { reason?: string }) {
  return (
    <span className="route-lock" aria-label={`Bloqueada: ${reason}`} title={reason}>
      <ItemIcon item={ICON.Locked} size={32} />
    </span>
  )
}
