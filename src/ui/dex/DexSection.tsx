import type { ReactNode } from 'react'
import type { DexSection as Section } from '../../data/pokedexes'
import { Foldout } from '../shared/Foldout'

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
  const { dex } = section
  return (
    <Foldout
      kicker="Pokédex"
      title={dex ? dex.name : 'Nacional'}
      className={dex ? '' : 'national'}
      art={
        dex && (
          <span
            className="dex-section-map"
            style={{ backgroundImage: `url(${dex.backdrop.image})`, backgroundPositionY: `${dex.backdrop.focusY}%` }}
          />
        )
      }
      aside={
        <>
          <strong>{caught}</strong>/{total}
        </>
      }
      defaultOpen={defaultOpen}
      forceOpen={forceOpen}
    >
      {children}
    </Foldout>
  )
}
