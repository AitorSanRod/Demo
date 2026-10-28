export interface Encounter {
  speciesId: number
  weight: number
}

// De momento solo hay combates salvajes. Tipos previstos: 'trainer' | 'chest' | 'rest' | 'boss' | 'special'
export type NodeKind = 'start' | 'wild'

export interface RouteEdge {
  to: string
  steps: number
}

export interface RouteNode {
  id: string
  name: string
  kind: NodeKind
  /** Posición en el plano de la ruta: col en % del ancho, row de abajo (0) hacia arriba */
  col: number
  row: number
  next: RouteEdge[]
  levelBonus?: number
  /** Si se define, sustituye a los encuentros de la ruta */
  encounters?: Encounter[]
}

/** Fondo de la escena de caminar (ver src/ui/scenery.ts) */
export type Biome = 'meadow' | 'forest' | 'cave' | 'sea'

export interface Route {
  id: string
  name: string
  description: string
  /** Fondo animado que se ve mientras el Pokémon camina */
  biome: Biome
  levels: [number, number]
  encounters: Encounter[]
  nodes: RouteNode[]
  reward: { tickets: number; money: number }
  unlocks?: string
}

export interface GameMap {
  id: string
  name: string
  routes: Route[]
}

const enc = (...pairs: [number, number][]): Encounter[] =>
  pairs.map(([speciesId, weight]) => ({ speciesId, weight }))

export const KANTO: GameMap = {
  id: 'kanto',
  name: 'Kanto',
  routes: [
    {
      id: 'ruta-1',
      name: 'Ruta 1',
      description: 'Un camino tranquilo entre Pueblo Paleta y Ciudad Verde.',
      biome: 'meadow',
      levels: [2, 4],
      encounters: enc([16, 5], [19, 5], [10, 2], [13, 2], [29, 1], [32, 1]),
      reward: { tickets: 3, money: 100 },
      unlocks: 'bosque-verde',
      nodes: [
        { id: 's', name: 'Pueblo Paleta', kind: 'start', col: 50, row: 0, next: [{ to: 'a', steps: 60 }] },
        { id: 'a', name: 'Prado', kind: 'wild', col: 50, row: 1, next: [{ to: 'b1', steps: 70 }, { to: 'b2', steps: 100 }] },
        { id: 'b1', name: 'Hierba alta', kind: 'wild', col: 22, row: 2, levelBonus: 1, next: [{ to: 'c', steps: 60 }] },
        { id: 'b2', name: 'Sendero', kind: 'wild', col: 78, row: 2, next: [{ to: 'c', steps: 60 }] },
        { id: 'c', name: 'Cruce', kind: 'wild', col: 50, row: 3, next: [{ to: 'd1', steps: 80 }, { to: 'd2', steps: 80 }] },
        { id: 'd1', name: 'Arboleda', kind: 'wild', col: 25, row: 4, encounters: enc([10, 3], [13, 3], [16, 2]), next: [{ to: 'e', steps: 70 }] },
        { id: 'd2', name: 'Campo', kind: 'wild', col: 75, row: 4, encounters: enc([19, 3], [29, 2], [32, 2]), next: [{ to: 'e', steps: 70 }] },
        { id: 'e', name: 'Entrada a Ciudad Verde', kind: 'wild', col: 50, row: 5, levelBonus: 2, next: [] },
      ],
    },
    {
      id: 'bosque-verde',
      name: 'Bosque Verde',
      description: 'Un bosque frondoso lleno de Pokémon bicho.',
      biome: 'forest',
      levels: [4, 7],
      encounters: enc([10, 4], [11, 3], [13, 4], [14, 3], [16, 2], [25, 1], [43, 2], [69, 2]),
      reward: { tickets: 4, money: 180 },
      unlocks: 'monte-moon',
      nodes: [
        { id: 's', name: 'Linde del bosque', kind: 'start', col: 50, row: 0, next: [{ to: 'a', steps: 80 }] },
        { id: 'a', name: 'Sotobosque', kind: 'wild', col: 50, row: 1, next: [{ to: 'b1', steps: 90 }, { to: 'b2', steps: 90 }] },
        { id: 'b1', name: 'Matorral', kind: 'wild', col: 20, row: 2, encounters: enc([43, 3], [69, 3], [10, 2]), next: [{ to: 'c', steps: 80 }] },
        { id: 'b2', name: 'Tronco hueco', kind: 'wild', col: 80, row: 2, encounters: enc([11, 3], [14, 3], [25, 1]), next: [{ to: 'c', steps: 80 }] },
        { id: 'c', name: 'Claro', kind: 'wild', col: 50, row: 3, next: [{ to: 'd1', steps: 70 }, { to: 'd2', steps: 120 }] },
        { id: 'd1', name: 'Atajo espeso', kind: 'wild', col: 25, row: 4, levelBonus: 2, next: [{ to: 'e', steps: 70 }] },
        { id: 'd2', name: 'Sendero largo', kind: 'wild', col: 75, row: 4, next: [{ to: 'e', steps: 60 }] },
        { id: 'e', name: 'Corazón del bosque', kind: 'wild', col: 50, row: 5, levelBonus: 2, encounters: enc([25, 3], [12, 1], [15, 1]), next: [] },
      ],
    },
    {
      id: 'monte-moon',
      name: 'Monte Moon',
      description: 'Cuevas oscuras donde dicen que caen meteoritos.',
      biome: 'cave',
      levels: [7, 11],
      encounters: enc([41, 5], [74, 4], [46, 3], [27, 2], [23, 2], [66, 2], [35, 1], [39, 1]),
      reward: { tickets: 5, money: 300 },
      unlocks: 'ruta-marina',
      nodes: [
        { id: 's', name: 'Entrada a la cueva', kind: 'start', col: 50, row: 0, next: [{ to: 'a', steps: 90 }] },
        { id: 'a', name: 'Galería', kind: 'wild', col: 50, row: 1, next: [{ to: 'b1', steps: 100 }, { to: 'b2', steps: 100 }] },
        { id: 'b1', name: 'Túnel de rocas', kind: 'wild', col: 22, row: 2, encounters: enc([74, 4], [27, 2], [66, 2]), next: [{ to: 'c', steps: 90 }] },
        { id: 'b2', name: 'Charca subterránea', kind: 'wild', col: 78, row: 2, encounters: enc([41, 4], [46, 3], [23, 2]), next: [{ to: 'c', steps: 90 }] },
        { id: 'c', name: 'Cámara central', kind: 'wild', col: 50, row: 3, next: [{ to: 'd1', steps: 100 }, { to: 'd2', steps: 100 }] },
        { id: 'd1', name: 'Grieta', kind: 'wild', col: 25, row: 4, levelBonus: 1, next: [{ to: 'e', steps: 80 }] },
        { id: 'd2', name: 'Cráter lunar', kind: 'wild', col: 75, row: 4, encounters: enc([35, 4], [39, 3], [41, 2]), next: [{ to: 'e', steps: 80 }] },
        { id: 'e', name: 'Cima del monte', kind: 'wild', col: 50, row: 5, levelBonus: 3, encounters: enc([35, 2], [74, 2], [42, 1], [75, 1]), next: [] },
      ],
    },
    {
      id: 'ruta-marina',
      name: 'Ruta Marina',
      description: 'Islotes y corrientes. Hay que nadar mucho.',
      biome: 'sea',
      levels: [13, 18],
      encounters: enc([72, 5], [54, 3], [60, 3], [129, 4], [116, 2], [98, 2], [120, 2], [90, 2]),
      reward: { tickets: 6, money: 450 },
      nodes: [
        { id: 's', name: 'Playa', kind: 'start', col: 50, row: 0, next: [{ to: 'a', steps: 100 }] },
        { id: 'a', name: 'Bajío', kind: 'wild', col: 50, row: 1, next: [{ to: 'b1', steps: 110 }, { to: 'b2', steps: 110 }] },
        { id: 'b1', name: 'Arrecife', kind: 'wild', col: 22, row: 2, encounters: enc([120, 3], [90, 3], [98, 3]), next: [{ to: 'c', steps: 100 }] },
        { id: 'b2', name: 'Mar abierto', kind: 'wild', col: 78, row: 2, encounters: enc([72, 4], [116, 3], [129, 3]), next: [{ to: 'c', steps: 100 }] },
        { id: 'c', name: 'Islote', kind: 'wild', col: 50, row: 3, next: [{ to: 'd1', steps: 110 }, { to: 'd2', steps: 110 }] },
        { id: 'd1', name: 'Corriente', kind: 'wild', col: 25, row: 4, levelBonus: 2, next: [{ to: 'e', steps: 90 }] },
        { id: 'd2', name: 'Cala', kind: 'wild', col: 75, row: 4, encounters: enc([54, 3], [60, 3], [79, 2]), next: [{ to: 'e', steps: 90 }] },
        { id: 'e', name: 'Remolino', kind: 'wild', col: 50, row: 5, levelBonus: 3, encounters: enc([73, 2], [130, 1], [121, 1], [55, 1]), next: [] },
      ],
    },
  ],
}

export function route(id: string): Route {
  const r = KANTO.routes.find((r) => r.id === id)
  if (!r) throw new Error(`Ruta desconocida: ${id}`)
  return r
}

export function node(r: Route, id: string): RouteNode {
  const n = r.nodes.find((n) => n.id === id)
  if (!n) throw new Error(`Nodo desconocido: ${r.id}/${id}`)
  return n
}
