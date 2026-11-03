import { RanchTypeId } from '../../data/ranchTypes'

/**
 * Aspecto de cada rancho. PROVISIONAL: todos usan la misma imagen con otro tono hasta tener un fondo propio para cada
 * uno. Un rancho con tipo se ve con el tono de su tipo; si no, con el de su posición (si hay más ranchos que tonos, se
 * repiten).
 */
const RANCH_FILTERS = ['none', 'hue-rotate(-35deg) saturate(1.2)', 'hue-rotate(160deg) saturate(0.8)', 'sepia(0.6) hue-rotate(-20deg)']

const RANCH_TYPE_FILTERS: Record<RanchTypeId, string> = {
  [RanchTypeId.Ocean]: 'hue-rotate(110deg) saturate(1.3)',
  [RanchTypeId.Volcano]: 'hue-rotate(-90deg) saturate(1.4) brightness(0.9)',
  [RanchTypeId.Forest]: 'saturate(1.5) brightness(0.85)',
  [RanchTypeId.PowerPlant]: 'hue-rotate(-40deg) saturate(1.6)',
  [RanchTypeId.Glacier]: 'hue-rotate(90deg) saturate(0.5) brightness(1.25)',
  [RanchTypeId.Dojo]: 'sepia(0.5) saturate(1.2)',
  [RanchTypeId.Swamp]: 'hue-rotate(200deg) saturate(0.9) brightness(0.85)',
  [RanchTypeId.Sky]: 'hue-rotate(70deg) brightness(1.2) saturate(0.8)',
  [RanchTypeId.Temple]: 'hue-rotate(220deg) saturate(1.1)',
  [RanchTypeId.Graveyard]: 'grayscale(0.6) hue-rotate(180deg) brightness(0.7)',
  [RanchTypeId.Mountain]: 'sepia(0.8) saturate(0.9)',
  [RanchTypeId.Coast]: 'hue-rotate(60deg) saturate(1.1) brightness(1.1)',
  [RanchTypeId.Jungle]: 'saturate(1.8) hue-rotate(-10deg) brightness(0.8)',
  [RanchTypeId.Cave]: 'grayscale(0.5) sepia(0.4) brightness(0.7)',
  [RanchTypeId.Factory]: 'grayscale(0.8) brightness(0.9)',
  [RanchTypeId.Meadow]: 'hue-rotate(-20deg) saturate(1.3) brightness(1.1)',
}

export const ranchFilter = (ranch: number, type?: RanchTypeId): string => (type ? RANCH_TYPE_FILTERS[type] : RANCH_FILTERS[ranch % RANCH_FILTERS.length])
