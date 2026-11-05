import type { ReactNode } from 'react'
import type { Route } from '../../data/maps'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './route.css'

/**
 * Tarjeta de una línea sobre una imagen difuminada (`focusY`: qué franja se ve, en % de su alto): base de las listas
 * de rutas, de expediciones y de la sala de un jefe
 */
export function BackdropRow({ image, focusY = 50, className = '', children }: { image?: string; focusY?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`card route-row ${className}`}>
      {image && <span className="route-backdrop" style={{ backgroundImage: `url(${image})`, backgroundPositionY: `${focusY}%` }} aria-hidden="true" />}
      {children}
    </div>
  )
}

/** Línea sobre la imagen de la zona de la ruta */
export function RouteRow({ route: r, locked = false, children }: { route: Route; locked?: boolean; children: ReactNode }) {
  return (
    <BackdropRow image={r.backdrop?.image} focusY={r.backdrop?.focusY} className={locked ? 'locked' : ''}>
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

/** Candado de una ruta aún bloqueada */
export function RouteLock() {
  return (
    <span className="route-lock" aria-label="Bloqueada: completa la ruta anterior" title="Completa la ruta anterior">
      <ItemIcon item={ICON.Locked} size={32} />
    </span>
  )
}
