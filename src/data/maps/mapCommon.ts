export interface Encounter {
  speciesId: number
  /** Probabilidad de que salga, en %. Los de una misma lista suman 100 */
  chance: number
}

/** Tipos de parada. Previstos para más adelante: entrenador, cofre, descanso y especial */
export const NodeKind = { Start: 'start', Wild: 'wild', Boss: 'boss' } as const
export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]

/** Fondo de la escena de caminar (ver src/ui/route/scenery/) */
export const Biome = { Meadow: 'meadow', Forest: 'forest', Cave: 'cave', Sea: 'sea' } as const
export type Biome = (typeof Biome)[keyof typeof Biome]

/** Rutas por su id. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const RouteId = {
  PuebloPaleta: 'pueblo-paleta',
  Ruta1: 'ruta-1',
  BosqueVerde: 'bosque-verde',
  MonteMoon: 'monte-moon',
  RutaMarina: 'ruta-marina',
} as const
export type RouteId = (typeof RouteId)[keyof typeof RouteId]

/** Rival fijo de una parada de jefe */
export interface Boss {
  speciesId: number
  level: number
}

interface RouteEdge {
  to: string
  steps: number
}

/**
 * Las rutas son grafos: un nodo con varios `next` es una bifurcación y el jugador elige el camino antes de
 * salir. Las rutas actuales son caminos únicos.
 */
export interface RouteNode {
  id: string
  name: string
  kind: NodeKind
  next: RouteEdge[]
  levelBonus?: number
  /** Si se define, sustituye a los encuentros de la ruta */
  encounters?: Encounter[]
  /** Obligatorio en las paradas de jefe: siempre sale este Pokémon a este nivel */
  boss?: Boss
}

export interface Route {
  id: RouteId
  name: string
  description: string
  /** Fondo animado que se ve mientras el Pokémon camina */
  biome: Biome
  levels: [number, number]
  encounters: Encounter[]
  nodes: RouteNode[]
  /**
   * Premio al completar la ruta; `exp` es la única forma de ganar EXP además de entrenar.
   * `firstClearTickets` se suma solo la primera vez que se completa.
   */
  reward: { tickets: number; money: number; exp: number; firstClearTickets?: number }
  unlocks?: RouteId
}

export interface GameMap {
  id: string
  name: string
  routes: Route[]
}

/** Pokémon que salen y su probabilidad en %: `enc([POKEMON.Pidgey, 30], [POKEMON.Rattata, 70])` */
export const enc = (...chances: [speciesId: number, chance: number][]): Encounter[] =>
  chances.map(([speciesId, chance]) => ({ speciesId, chance }))

/** Jefe de una parada: `boss(POKEMON.Pidgeotto, 7)` */
export const boss = (speciesId: number, level: number): Boss => ({ speciesId, level })

/** Atajo para un camino sin bifurcar: cada nodo enlaza con el siguiente de la lista */
type Stop = Omit<RouteNode, 'next'> & { steps: number }
export function chain(...stops: Stop[]): RouteNode[] {
  return stops.map(({ steps: _steps, ...stop }, i) => {
    const next = stops[i + 1]
    return { ...stop, next: next ? [{ to: next.id, steps: next.steps }] : [] }
  })
}

export function node(r: Route, id: string): RouteNode {
  const n = r.nodes.find((n) => n.id === id)
  if (!n) throw new Error(`Nodo desconocido: ${r.id}/${id}`)
  return n
}

function startNode(r: Route): RouteNode {
  return r.nodes.find((n) => n.kind === NodeKind.Start) ?? r.nodes[0]
}

/** Camino desde `fromId` hasta un final tomando siempre la primera opción de cada bifurcación */
export function pathFrom(r: Route, fromId = startNode(r).id): string[] {
  const path = [fromId]
  for (let n = node(r, fromId); n.next.length > 0; n = node(r, n.next[0].to)) path.push(n.next[0].to)
  return path
}

/** Un camino válido empieza en el inicio, sigue aristas existentes y acaba en un nodo final */
export function isValidPath(r: Route, path: string[]): boolean {
  if (path[0] !== startNode(r).id || !path.every((id) => r.nodes.some((n) => n.id === id))) return false
  const linked = path.every((id, i) => i === 0 || node(r, path[i - 1]).next.some((e) => e.to === id))
  return linked && node(r, path[path.length - 1]).next.length === 0
}

/** Pasos del tramo que llega al nodo `path[i]` */
export function legSteps(r: Route, path: string[], i: number): number {
  return node(r, path[i - 1]).next.find((e) => e.to === path[i])!.steps
}
