import type { PassiveRef } from '../passives'
import type { RaidTier } from '../raidBosses'

export interface Encounter {
  speciesId: number
  /** Probabilidad de que salga, en %. Los de una misma lista suman 100 */
  chance: number
}

/**
 * Tipos de parada. `Raid`: jefe comunitario; al llegar empieza una pelea en sala con los que van llegando (ver
 * game/raid/routeRaid.ts). Previstos para más adelante: entrenador, cofre, descanso y especial
 */
export const NodeKind = { Start: 'start', Wild: 'wild', Boss: 'boss', Raid: 'raid' } as const
export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]

/** Fondo de la escena de caminar (ver src/ui/route/pixelScene/ y scenery/). PalletTown es solo de Pueblo Paleta */
export const Biome = { Meadow: 'meadow', PalletTown: 'pallet-town', Forest: 'forest', Cave: 'cave', Sea: 'sea' } as const
export type Biome = (typeof Biome)[keyof typeof Biome]

/** Rutas por su id. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const RouteId = {
  PuebloPaleta: 'pueblo-paleta',
  Ruta1: 'ruta-1',
  Ruta1Boss: 'ruta-1-boss',
  BosqueVerde: 'bosque-verde',
  MonteMoon: 'monte-moon',
  RutaMarina: 'ruta-marina',
} as const
export type RouteId = (typeof RouteId)[keyof typeof RouteId]

/** Rival fijo de una parada de jefe; `passives` son sus pasivas de tipo, escritas a mano (sin ellas no tiene) */
export interface Boss {
  speciesId: number
  level: number
  passives?: PassiveRef[]
  /** Tabla de premios (`RAID_PRIZE_TABLES`) si es jefe comunitario: obligatoria en las paradas `NodeKind.Raid` */
  tier?: RaidTier
  /** Minutos que tardaría en caer con un solo Pokémon de su nivel, si es jefe comunitario; sin él, RAID_SOLO_MINUTES */
  soloMinutes?: number
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
  /** Obligatorio en las paradas de jefe y de jefe comunitario: siempre sale este Pokémon a este nivel */
  boss?: Boss
}

/** Imagen de ambientación de la ruta en la lista de rutas (se ve difuminada detrás de su línea) */
export interface RouteBackdrop {
  image: string
  /** Qué franja de la imagen se ve, en % de su alto: 0 enseña la parte de arriba y 100 la de abajo */
  focusY: number
}

export interface Route {
  id: RouteId
  name: string
  description: string
  /** Fondo animado que se ve mientras el Pokémon camina */
  biome: Biome
  backdrop?: RouteBackdrop
  levels: [number, number]
  encounters: Encounter[]
  nodes: RouteNode[]
  /**
   * Premio por completar la ruta, solo la primera vez (al repetirla se gana solo lo de sus combates).
   * `exp` es también la base de la EXP de sus expediciones.
   */
  reward: { tickets: number; money: number; exp: number }
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
export const boss = (speciesId: number, level: number, passives?: PassiveRef[]): Boss => ({ speciesId, level, passives })

/** Jefe comunitario de una parada `NodeKind.Raid`: `raidBoss(POKEMON.Pidgeotto, 12, RaidTier.Low, { soloMinutes: 10 })` */
export const raidBoss = (speciesId: number, level: number, tier: RaidTier, opts: { soloMinutes?: number } = {}): Boss => ({ speciesId, level, tier, ...opts })

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

/** Especies que pueden salir en un camino, sin repetir y por orden de aparición: los salvajes de cada parada y los jefes */
export function pathSpecies(r: Route, path: string[]): number[] {
  const ids = path.flatMap((id) => {
    const n = node(r, id)
    if (n.boss) return [n.boss.speciesId]
    return n.kind === NodeKind.Wild ? (n.encounters ?? r.encounters).map((e) => e.speciesId) : []
  })
  return [...new Set(ids)]
}

/** Pasos del tramo que llega al nodo `path[i]` */
export function legSteps(r: Route, path: string[], i: number): number {
  return node(r, path[i - 1]).next.find((e) => e.to === path[i])!.steps
}
