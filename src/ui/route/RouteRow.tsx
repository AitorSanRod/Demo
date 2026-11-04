import type { ReactNode } from 'react'
import type { Route } from '../../data/maps'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './route.css'

/** Tarjeta de una línea sobre la imagen de la zona de la ruta, difuminada: base de la lista de rutas y de expediciones */
export function RouteRow({ route: r, locked = false, children }: { route: Route; locked?: boolean; children: ReactNode }) {
  return (
    <div className={`card route-row ${locked ? 'locked' : ''}`}>
      {r.backdrop && (
        <span
          className="route-backdrop"
          style={{ backgroundImage: `url(${r.backdrop.image})`, backgroundPositionY: `${r.backdrop.focusY}%` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
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
