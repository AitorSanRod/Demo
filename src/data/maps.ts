import { speciesByName } from './species'

export interface Encounter {
  speciesId: number
  /** Probabilidad de que salga, en %. Los de una misma lista suman 100 */
  chance: number
}

/** Tipos de parada. Previstos para más adelante: 'trainer' | 'chest' | 'rest' | 'special' */
type NodeKind = 'start' | 'wild' | 'boss'

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
  /** Obligatorio en las paradas 'boss': siempre sale este Pokémon a este nivel */
  boss?: Boss
}

/** Fondo de la escena de caminar (ver src/ui/route/scenery/) */
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
  /**
   * Premio al completar la ruta; `exp` es la única forma de ganar EXP además de entrenar.
   * `firstClearTickets` se suma solo la primera vez que se completa.
   */
  reward: { tickets: number; money: number; exp: number; firstClearTickets?: number }
  unlocks?: string
}

interface GameMap {
  id: string
  name: string
  routes: Route[]
}

/** Pokémon que salen y su probabilidad en %: `enc({ Pidgey: 30, Rattata: 70 })` */
const enc = (chances: Record<string, number>): Encounter[] =>
  Object.entries(chances).map(([name, chance]) => ({ speciesId: speciesByName(name).id, chance }))

/** Jefe de una parada por su nombre exacto de pokemon.json: `boss('Pidgeotto', 7)` */
const boss = (name: string, level: number): Boss => ({ speciesId: speciesByName(name).id, level })

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
      id: 'pueblo-paleta',
      name: 'Pueblo Paleta',
      description: 'Tu primer paseo: da una vuelta por el pueblo antes de salir a la Ruta 1.',
      biome: 'meadow',
      levels: [2, 3],
      encounters: enc({ Pidgey: 40, Rattata: 40, Caterpie: 20 }),
      reward: { tickets: 0, money: 50, exp: 100, firstClearTickets: 3 },
      unlocks: 'ruta-1',
      nodes: chain(
        { id: 's', name: 'Tu casa', kind: 'start', steps: 0 },
        { id: 'a', name: 'Jardín', kind: 'wild', steps: 18 },
        { id: 'b', name: 'Plaza', kind: 'wild', steps: 18 },
        { id: 'c', name: 'Afueras', kind: 'wild', steps: 20 },
      ),
    },
    {
      // ~6 min y 7 combates, el último contra un jefe: con un inicial sin mejorar se pierde casi siempre
      id: 'ruta-1',
      name: 'Ruta 1',
      description: 'El camino a Ciudad Verde. Más largo y peligroso de lo que parece.',
      biome: 'meadow',
      levels: [5, 8],
      encounters: enc({ Pidgey: 30, Rattata: 30, Caterpie: 13, Weedle: 13, 'Nidoran♀': 7, 'Nidoran♂': 7 }),
      reward: { tickets: 3, money: 100, exp: 150 },
      // unlocks: 'bosque-verde', (reactivar junto con Bosque Verde)
      nodes: chain(
        { id: 's', name: 'Salida del pueblo', kind: 'start', steps: 0 },
        { id: 'a', name: 'Prado', kind: 'wild', steps: 16 },
        { id: 'b', name: 'Hierba alta', kind: 'wild', steps: 16, levelBonus: 1 },
        { id: 'c', name: 'Arboleda', kind: 'wild', steps: 16, encounters: enc({ Caterpie: 40, Weedle: 40, Pidgey: 20 }) },
        { id: 'd', name: 'Senda', kind: 'wild', steps: 16 },
        { id: 'e', name: 'Campo', kind: 'wild', steps: 16, encounters: enc({ Rattata: 40, 'Nidoran♀': 30, 'Nidoran♂': 30 }) },
        { id: 'f', name: 'Hierba crecida', kind: 'wild', steps: 16, levelBonus: 2 },
        { id: 'g', name: 'Entrada a Ciudad Verde', kind: 'boss', steps: 16, boss: boss('Pidgeotto', 7) },
      ),
    },
    // {
    //   id: 'bosque-verde',
    //   name: 'Bosque Verde',
    //   description: 'Un bosque frondoso lleno de Pokémon bicho.',
    //   biome: 'forest',
    //   levels: [4, 7],
    //   encounters: enc({ Caterpie: 20, Weedle: 20, Metapod: 15, Kakuna: 15, Pidgey: 8, Oddish: 8, Bellsprout: 8, Pikachu: 6 }),
    //   reward: { tickets: 4, money: 180, exp: 350 },
    //   unlocks: 'monte-moon',
    //   nodes: chain(
    //     { id: 's', name: 'Linde del bosque', kind: 'start', steps: 0 },
    //     { id: 'a', name: 'Sotobosque', kind: 'wild', steps: 80 },
    //     { id: 'b', name: 'Matorral', kind: 'wild', steps: 90, encounters: enc({ Oddish: 40, Bellsprout: 40, Caterpie: 20 }) },
    //     { id: 'c', name: 'Tronco hueco', kind: 'wild', steps: 80, encounters: enc({ Metapod: 43, Kakuna: 43, Pikachu: 14 }) },
    //     { id: 'd', name: 'Claro', kind: 'wild', steps: 80, levelBonus: 1 },
    //     { id: 'e', name: 'Corazón del bosque', kind: 'wild', steps: 70, levelBonus: 2, encounters: enc({ Pikachu: 60, Butterfree: 20, Beedrill: 20 }) },
    //   ),
    // },
    // {
    //   id: 'monte-moon',
    //   name: 'Monte Moon',
    //   description: 'Cuevas oscuras donde dicen que caen meteoritos.',
    //   biome: 'cave',
    //   levels: [7, 11],
    //   encounters: enc({ Zubat: 25, Geodude: 20, Paras: 15, Sandshrew: 10, Ekans: 10, Machop: 10, Clefairy: 5, Jigglypuff: 5 }),
    //   reward: { tickets: 5, money: 300, exp: 800 },
    //   unlocks: 'ruta-marina',
    //   nodes: chain(
    //     { id: 's', name: 'Entrada a la cueva', kind: 'start', steps: 0 },
    //     { id: 'a', name: 'Galería', kind: 'wild', steps: 90 },
    //     { id: 'b', name: 'Túnel de rocas', kind: 'wild', steps: 100, encounters: enc({ Geodude: 50, Sandshrew: 25, Machop: 25 }) },
    //     { id: 'c', name: 'Charca subterránea', kind: 'wild', steps: 90, encounters: enc({ Zubat: 45, Paras: 33, Ekans: 22 }) },
    //     { id: 'd', name: 'Cráter lunar', kind: 'wild', steps: 100, levelBonus: 1, encounters: enc({ Clefairy: 45, Jigglypuff: 33, Zubat: 22 }) },
    //     { id: 'e', name: 'Cima del monte', kind: 'wild', steps: 80, levelBonus: 3, encounters: enc({ Clefairy: 33, Geodude: 33, Golbat: 17, Graveler: 17 }) },
    //   ),
    // },
    // {
    //   id: 'ruta-marina',
    //   name: 'Ruta Marina',
    //   description: 'Islotes y corrientes. Hay que nadar mucho.',
    //   biome: 'sea',
    //   levels: [13, 18],
    //   encounters: enc({ Tentacool: 22, Magikarp: 17, Psyduck: 13, Poliwag: 13, Horsea: 9, Krabby: 9, Staryu: 9, Shellder: 8 }),
    //   reward: { tickets: 6, money: 450, exp: 1800 },
    //   nodes: chain(
    //     { id: 's', name: 'Playa', kind: 'start', steps: 0 },
    //     { id: 'a', name: 'Bajío', kind: 'wild', steps: 100 },
    //     { id: 'b', name: 'Arrecife', kind: 'wild', steps: 110, encounters: enc({ Staryu: 34, Shellder: 33, Krabby: 33 }) },
    //     { id: 'c', name: 'Mar abierto', kind: 'wild', steps: 100, encounters: enc({ Tentacool: 40, Horsea: 30, Magikarp: 30 }) },
    //     { id: 'd', name: 'Cala', kind: 'wild', steps: 110, levelBonus: 2, encounters: enc({ Psyduck: 38, Poliwag: 37, Slowpoke: 25 }) },
    //     { id: 'e', name: 'Remolino', kind: 'wild', steps: 90, levelBonus: 3, encounters: enc({ Tentacruel: 40, Gyarados: 20, Starmie: 20, Golduck: 20 }) },
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
  return r.nodes.find((n) => n.kind === 'start') ?? r.nodes[0]
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
