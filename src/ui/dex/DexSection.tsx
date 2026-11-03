import { useState, type ReactNode } from 'react'
import type { DexSection as Section } from '../../data/pokedexes'

interface Props {
  section: Section
  caught: number
  /** Total de la Pokédex completa, aunque el filtro enseñe menos */
  total: number
  defaultOpen: boolean
  /** Abierta sin poder cerrarla (filtro puesto o casilla del tutorial dentro) */
  forceOpen: boolean
  children: ReactNode
}

/** Desplegable de una Pokédex: cabecera con el mapa de su región difuminado (la Nacional, con una Poké Ball) */
export function DexSection({ section, caught, total, defaultOpen, forceOpen, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const shownOpen = open || forceOpen
  const { dex } = section
  return (
    <section className={`dex-section ${shownOpen ? 'open' : ''}`}>
      <button className={`dex-section-head ${dex ? '' : 'national'}`} onClick={() => setOpen(!shownOpen)} aria-expanded={shownOpen}>
        {dex && (
          <span
            className="dex-section-map"
            style={{ backgroundImage: `url(${dex.backdrop.image})`, backgroundPositionY: `${dex.backdrop.focusY}%` }}
          />
        )}
        <span className="dex-section-title">
          <span className="dex-section-kicker">Pokédex</span>
          <strong>{dex ? dex.name : 'Nacional'}</strong>
        </span>
        <span className="dex-section-count">
          <strong>{caught}</strong>/{total}
        </span>
        <span className="dex-section-chevron" aria-hidden />
      </button>
      {shownOpen && <div className="dex-section-body">{children}</div>}
    </section>
  )
}
