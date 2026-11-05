import { node, NodeKind, type Route } from '../../data/maps'
import type { GameState } from '../core/state'
import type { RaidPlace } from './raidRoom'

// Repetir seguido la misma parada de jefe comunitario da cada vez menos dinero, para que una ruta corta con jefe no
// rinda más que avanzar. La racha se olvida si pasa ROUTE_RAID_STREAK_RESET_MS sin derrotarlo.

/** Milisegundos reales sin derrotar al jefe de una parada para que su dinero vuelva a ser entero */
export const ROUTE_RAID_STREAK_RESET_MS = 5 * 60 * 1000
/** Cada victoria seguida contra el jefe de la misma parada multiplica su dinero por esto */
export const ROUTE_RAID_REPEAT_MONEY_MULT = 0.5
/** Fracción mínima del dinero del jefe, por muchas veces seguidas que se repita */
export const ROUTE_RAID_MIN_MONEY_MULT = 0.1

const placeKey = (p: RaidPlace) => `${p.routeId}/${p.nodeId}`

/** Victorias seguidas contra el jefe de la parada que aún cuentan en `now` (ms reales) */
function streakAt(s: GameState, place: RaidPlace, now: number): number {
  const streak = s.routeRaidStreaks[placeKey(place)]
  return streak && now - streak.lastAt < ROUTE_RAID_STREAK_RESET_MS ? streak.count : 0
}

/** Fracción del dinero que da ahora el jefe de la parada (1 si no se ha repetido seguido) */
export const routeRaidMoneyMult = (s: GameState, place: RaidPlace, now: number): number =>
  Math.max(ROUTE_RAID_MIN_MONEY_MULT, ROUTE_RAID_REPEAT_MONEY_MULT ** streakAt(s, place, now))

/** La fracción más baja del dinero que darían ahora los jefes de las paradas del camino (1 si no hay rebaja) */
export function pathRaidMoneyMult(s: GameState, r: Route, path: string[], now: number): number {
  const raidStops = path.filter((id) => node(r, id).kind === NodeKind.Raid)
  return Math.min(1, ...raidStops.map((nodeId) => routeRaidMoneyMult(s, { routeId: r.id, nodeId }, now)))
}

/** Apunta una victoria contra el jefe de la parada: alarga la racha o empieza una nueva */
export function recordRouteRaidFall(s: GameState, place: RaidPlace, now: number) {
  s.routeRaidStreaks[placeKey(place)] = { count: streakAt(s, place, now) + 1, lastAt: now }
}
