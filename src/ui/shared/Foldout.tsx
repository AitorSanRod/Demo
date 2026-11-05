import { useState, type ReactNode } from 'react'
import './foldout.css'

interface Props {
  /** Texto pequeño en mayúsculas sobre el título */
  kicker: string
  title: string
  /** Lo que va a la derecha del título (un contador, por ejemplo) */
  aside?: ReactNode
  /** Fondo de la cabecera (un mapa difuminado, un icono grande…); va detrás del velo oscuro */
  art?: ReactNode
  /** Clase extra de la sección, para su color o su fondo */
  className?: string
  defaultOpen: boolean
  /** Abierta sin poder cerrarla */
  forceOpen?: boolean
  children: ReactNode
}

/** Desplegable con cabecera grande (la de las Pokédex): se abre y cierra tocando la cabecera */
export function Foldout({ kicker, title, aside, art, className = '', defaultOpen, forceOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const shownOpen = open || forceOpen
  return (
    <section className={`foldout ${className} ${shownOpen ? 'open' : ''}`}>
      <button className="foldout-head" onClick={() => setOpen(!shownOpen)} aria-expanded={shownOpen}>
        {art}
        <span className="foldout-title">
          <span className="foldout-kicker">{kicker}</span>
          <strong>{title}</strong>
        </span>
        {aside !== undefined && <span className="foldout-aside">{aside}</span>}
        <span className="foldout-chevron" aria-hidden />
      </button>
      {shownOpen && <div className="foldout-body">{children}</div>}
    </section>
  )
}
