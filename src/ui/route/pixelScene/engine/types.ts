import type { Pixmap } from '../paint/pixmap'

/** Una capa del paisaje: una tesela que se repite en horizontal (varios fotogramas si se mece) */
export interface SceneLayer {
  id: string
  label: string
  frames: Pixmap[]
  /** Fotogramas por segundo del balanceo (solo si hay más de un fotograma) */
  fps?: number
  anchor: 'top' | 'bottom'
  /** Distancia del borde de anclaje al borde de la capa, en píxeles de arte */
  offset: number
  /** Fracción de la velocidad del camino: 1 = se mueve con el suelo, 0 = quieta */
  parallax: number
  /** Movimiento propio en píxeles de arte por segundo, aunque el Pokémon esté parado (nubes) */
  drift?: number
  /** `back` va detrás del Pokémon, `front` delante */
  plane: 'back' | 'front'
  /** Puntos de la tesela que sueltan humo (chimeneas), en píxeles de arte */
  emitters?: { x: number; y: number }[]
}

/** Elementos sueltos que se animan cada fotograma (mariposas, pétalos, hojas) */
export interface ParticleSystem {
  /** `pathSpeed`: píxeles de arte por segundo que avanza el suelo ahora mismo */
  update(dt: number, pathSpeed: number, width: number, height: number): void
  draw(ctx: CanvasRenderingContext2D): void
}

/** Elemento que aparece al acercarse a una parada, pasa junto al Pokémon y se queda atrás */
export interface Landmark {
  id: string
  label: string
  pixmap: Pixmap
  /** Fracción de la velocidad del camino (menos de 1 si está más lejos que el camino) */
  parallax: number
  /** Altura de su base sobre el borde inferior, en píxeles de arte */
  bottom: number
  /** Se pinta justo después de esta capa (para que la hierba de delante lo tape) */
  afterLayer: string
}

export interface SceneDef {
  name: string
  /** Cielo para una pantalla de `height` píxeles de arte de alto */
  sky: (height: number) => Pixmap
  layers: SceneLayer[]
  /** Altura de los pies del Pokémon sobre el borde inferior, en píxeles de arte */
  walkerBottom: number
  particles?: ParticleSystem
  /** Elementos de las paradas (cartel, casa…) */
  landmarks: Landmark[]
  /** El Pokémon va nadando: se mece arriba y abajo (mar) */
  surf?: boolean
}
