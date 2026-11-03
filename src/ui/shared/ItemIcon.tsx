import { itemSprite, type Item } from '../../data/items'

/**
 * Icono de la interfaz dibujado con un objeto de los juegos (sprite de PokeAPI, 30×30 px), escalado sin suavizar.
 * `off` lo pinta en gris, p. ej. para una opción desactivada.
 */
export function ItemIcon({ item, size = 24, off = false, className = '' }: { item: Item; size?: number; off?: boolean; className?: string }) {
  return (
    <img
      className={`item-icon ${off ? 'off' : ''} ${className}`}
      src={itemSprite(item)}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  )
}
