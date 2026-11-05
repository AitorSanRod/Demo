import type { ReactNode } from 'react'
import type { Item } from '../../data/items'
import { RARITY_INFO, type Rarity } from '../../data/species'
import { Foldout } from '../shared/Foldout'
import { ItemIcon } from '../shared/ItemIcon'
import { RARITY_TITLE } from './rarityTitles'

interface Props {
  kicker: string
  rarity: Rarity
  /** Icono grande del fondo de la cabecera */
  art: Item
  aside?: ReactNode
  defaultOpen: boolean
  forceOpen?: boolean
  children: ReactNode
}

/** Desplegable de una rareza (como los de la Tienda), con la cabecera del color de esa rareza */
export function RarityFoldout({ kicker, rarity, art, aside, defaultOpen, forceOpen, children }: Props) {
  const color = RARITY_INFO[rarity].color
  return (
    <Foldout
      kicker={kicker}
      title={RARITY_TITLE[rarity]}
      aside={aside}
      art={<ItemIcon item={art} size={110} className="foldout-art" />}
      background={`linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 55%, #000) 100%)`}
      defaultOpen={defaultOpen}
      forceOpen={forceOpen}
    >
      {children}
    </Foldout>
  )
}
