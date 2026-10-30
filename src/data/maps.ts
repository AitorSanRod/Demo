import { Pokemon as P } from './pokemon'

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

interface GameMap {
  id: string
  name: string
  routes: Route[]
}

/** Pokémon que salen y su probabilidad en %: `enc([P.Pidgey, 30], [P.Rattata, 70])` */
const enc = (...chances: [speciesId: number, chance: number][]): Encounter[] =>
  chances.map(([speciesId, chance]) => ({ speciesId, chance }))

/** Jefe de una parada: `boss(P.Pidgeotto, 7)` */
const boss = (speciesId: number, level: number): Boss => ({ speciesId, level })

/** Atajo para un camino sin bifurcar: cada nodo enlaza con el siguiente de la lista */
type Stop = Omit<RouteNode, 'next'> & { steps: number }
function chain(...stops: Stop[]): RouteNode[] {
  return stops.map(({ steps: _steps, ...stop }, i) => {
    const next = stops[i + 1]
    return { ...stop, next: next ? [{ to: next.id, steps: next.steps }] : [] }
  })
}

export const KANTO: GameMap = {
  id: 'kanto',
  name: 'Kanto',
  routes: [
    {
      // Tutorial: ~3 min con un inicial (≈21 pasos/min) y 3 combates fáciles
      id: RouteId.PuebloPaleta,
      name: 'Pueblo Paleta',
      description: 'Tu primer paseo: da una vuelta por el pueblo antes de salir a la Ruta 1.',
      biome: Biome.Meadow,
      levels: [2, 3],
      encounters: enc([P.Pidgey, 40], [P.Rattata, 40], [P.Caterpie, 20]),
      reward: { tickets: 0, money: 50, exp: 100, firstClearTickets: 3 },
      unlocks: RouteId.Ruta1,
      nodes: chain(
        { id: 's', name: 'Tu casa', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Jardín', kind: NodeKind.Wild, steps: 18 },
        { id: 'b', name: 'Plaza', kind: NodeKind.Wild, steps: 18 },
        { id: 'c', name: 'Afueras', kind: NodeKind.Wild, steps: 20 },
      ),
    },
    {
      // ~6 min y 7 combates, el último contra un jefe: con un inicial sin mejorar se pierde casi siempre
      id: RouteId.Ruta1,
      name: 'Ruta 1',
      description: 'El camino a Ciudad Verde. Más largo y peligroso de lo que parece.',
      biome: Biome.Meadow,
      levels: [5, 8],
      encounters: enc([P.Pidgey, 30], [P.Rattata, 30], [P.Caterpie, 13], [P.Weedle, 13], [P.NidoranF, 7], [P.NidoranM, 7]),
      reward: { tickets: 2, money: 200, exp: 250 },
      // unlocks: RouteId.BosqueVerde, (reactivar junto con Bosque Verde)
      nodes: chain(
        { id: 's', name: 'Salida del pueblo', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Prado', kind: NodeKind.Wild, steps: 16 },
        { id: 'b', name: 'Hierba alta', kind: NodeKind.Wild, steps: 16, levelBonus: 1 },
        { id: 'c', name: 'Arboleda', kind: NodeKind.Wild, steps: 16, encounters: enc([P.Caterpie, 40], [P.Weedle, 40], [P.Pidgey, 20]) },
        { id: 'd', name: 'Senda', kind: NodeKind.Wild, steps: 16 },
        { id: 'e', name: 'Campo', kind: NodeKind.Wild, steps: 16, encounters: enc([P.Rattata, 40], [P.NidoranF, 30], [P.NidoranM, 30]) },
        { id: 'f', name: 'Hierba crecida', kind: NodeKind.Wild, steps: 16, levelBonus: 2 },
        { id: 'g', name: 'Entrada a Ciudad Verde', kind: NodeKind.Boss, steps: 16, boss: boss(P.Pidgeotto, 8) },
      ),
    },
    // {
    //   id: RouteId.BosqueVerde,
    //   name: 'Bosque Verde',
    //   description: 'Un bosque frondoso lleno de Pokémon bicho.',
    //   biome: Biome.Forest,
    //   levels: [4, 7],
    //   encounters: enc([P.Caterpie, 20], [P.Weedle, 20], [P.Metapod, 15], [P.Kakuna, 15], [P.Pidgey, 8], [P.Oddish, 8], [P.Bellsprout, 8], [P.Pikachu, 6]),
    //   reward: { tickets: 4, money: 180, exp: 350 },
    //   unlocks: RouteId.MonteMoon,
    //   nodes: chain(
    //     { id: 's', name: 'Linde del bosque', kind: NodeKind.Start, steps: 0 },
    //     { id: 'a', name: 'Sotobosque', kind: NodeKind.Wild, steps: 80 },
    //     { id: 'b', name: 'Matorral', kind: NodeKind.Wild, steps: 90, encounters: enc([P.Oddish, 40], [P.Bellsprout, 40], [P.Caterpie, 20]) },
    //     { id: 'c', name: 'Tronco hueco', kind: NodeKind.Wild, steps: 80, encounters: enc([P.Metapod, 43], [P.Kakuna, 43], [P.Pikachu, 14]) },
    //     { id: 'd', name: 'Claro', kind: NodeKind.Wild, steps: 80, levelBonus: 1 },
    //     { id: 'e', name: 'Corazón del bosque', kind: NodeKind.Wild, steps: 70, levelBonus: 2, encounters: enc([P.Pikachu, 60], [P.Butterfree, 20], [P.Beedrill, 20]) },
    //   ),
    // },
    // {
    //   id: RouteId.MonteMoon,
    //   name: 'Monte Moon',
    //   description: 'Cuevas oscuras donde dicen que caen meteoritos.',
    //   biome: Biome.Cave,
    //   levels: [7, 11],
    //   encounters: enc([P.Zubat, 25], [P.Geodude, 20], [P.Paras, 15], [P.Sandshrew, 10], [P.Ekans, 10], [P.Machop, 10], [P.Clefairy, 5], [P.Jigglypuff, 5]),
    //   reward: { tickets: 5, money: 300, exp: 800 },
    //   unlocks: RouteId.RutaMarina,
    //   nodes: chain(
    //     { id: 's', name: 'Entrada a la cueva', kind: NodeKind.Start, steps: 0 },
    //     { id: 'a', name: 'Galería', kind: NodeKind.Wild, steps: 90 },
    //     { id: 'b', name: 'Túnel de rocas', kind: NodeKind.Wild, steps: 100, encounters: enc([P.Geodude, 50], [P.Sandshrew, 25], [P.Machop, 25]) },
    //     { id: 'c', name: 'Charca subterránea', kind: NodeKind.Wild, steps: 90, encounters: enc([P.Zubat, 45], [P.Paras, 33], [P.Ekans, 22]) },
    //     { id: 'd', name: 'Cráter lunar', kind: NodeKind.Wild, steps: 100, levelBonus: 1, encounters: enc([P.Clefairy, 45], [P.Jigglypuff, 33], [P.Zubat, 22]) },
    //     { id: 'e', name: 'Cima del monte', kind: NodeKind.Wild, steps: 80, levelBonus: 3, encounters: enc([P.Clefairy, 33], [P.Geodude, 33], [P.Golbat, 17], [P.Graveler, 17]) },
    //   ),
    // },
    // {
    //   id: RouteId.RutaMarina,
    //   name: 'Ruta Marina',
    //   description: 'Islotes y corrientes. Hay que nadar mucho.',
    //   biome: Biome.Sea,
    //   levels: [13, 18],
    //   encounters: enc([P.Tentacool, 22], [P.Magikarp, 17], [P.Psyduck, 13], [P.Poliwag, 13], [P.Horsea, 9], [P.Krabby, 9], [P.Staryu, 9], [P.Shellder, 8]),
    //   reward: { tickets: 6, money: 450, exp: 1800 },
    //   nodes: chain(
    //     { id: 's', name: 'Playa', kind: NodeKind.Start, steps: 0 },
    //     { id: 'a', name: 'Bajío', kind: NodeKind.Wild, steps: 100 },
    //     { id: 'b', name: 'Arrecife', kind: NodeKind.Wild, steps: 110, encounters: enc([P.Staryu, 34], [P.Shellder, 33], [P.Krabby, 33]) },
    //     { id: 'c', name: 'Mar abierto', kind: NodeKind.Wild, steps: 100, encounters: enc([P.Tentacool, 40], [P.Horsea, 30], [P.Magikarp, 30]) },
    //     { id: 'd', name: 'Cala', kind: NodeKind.Wild, steps: 110, levelBonus: 2, encounters: enc([P.Psyduck, 38], [P.Poliwag, 37], [P.Slowpoke, 25]) },
    //     { id: 'e', name: 'Remolino', kind: NodeKind.Wild, steps: 90, levelBonus: 3, encounters: enc([P.Tentacruel, 40], [P.Gyarados, 20], [P.Starmie, 20], [P.Golduck, 20]) },
    //   ),
    // },
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
