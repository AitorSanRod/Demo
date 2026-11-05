import type { ReactNode } from 'react'
import type { Item } from '../../data/items'
import { Foldout } from '../shared/Foldout'
import { ItemIcon } from '../shared/ItemIcon'

interface SectionProps {
  title: string
  /** Icono grande del fondo de la cabecera */
  art: Item
  /** Clase con el color de la cabecera (`shop-fold-…` en shop.css) */
  tone: string
  defaultOpen?: boolean
  /** Explicación corta, encima de la cuadrícula */
  hint?: string
  children: ReactNode
}

/** Sección desplegable de la Tienda con sus artículos en cuadrícula */
export function ShopSection({ title, art, tone, defaultOpen = false, hint, children }: SectionProps) {
  return (
    <Foldout
      kicker="Tienda"
      title={title}
      className={`shop-fold ${tone}`}
      art={<ItemIcon item={art} size={110} className="foldout-art" />}
      defaultOpen={defaultOpen}
    >
      {hint && <p className="small muted shop-hint">{hint}</p>}
      <div className="shop-grid">{children}</div>
    </Foldout>
  )
}

interface TileProps {
  icon: ReactNode
  name: string
  /** Líneas pequeñas bajo el nombre (descripción, cuántos tienes…) */
  children?: ReactNode
  /** Botón de comprar o etiqueta de completado */
  action: ReactNode
}

/** Un artículo de la Tienda: icono, nombre, detalles y el botón de compra abajo */
export function ShopTile({ icon, name, children, action }: TileProps) {
  return (
    <div className="card shop-tile">
      <div className="shop-tile-icon">{icon}</div>
      <strong className="shop-tile-name">{name}</strong>
      <div className="shop-tile-info">{children}</div>
      <div className="shop-tile-action">{action}</div>
    </div>
  )
}
