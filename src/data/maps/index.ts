import { KANTO } from './kantoMaps'
import type { GameMap, Route } from './mapCommon'

export { KANTO }
export * from './mapCommon'

/** Regiones del juego; una región nueva (su fichero xxxMaps.ts) se añade aquí */
const REGIONS: GameMap[] = [KANTO]

/** La ruta `id`, o undefined si no existe (p. ej. la de una partida antigua que ya no está en el mapa) */
export const findRoute = (id: string): Route | undefined => REGIONS.flatMap((map) => map.routes).find((r) => r.id === id)

export function route(id: string): Route {
  const r = findRoute(id)
  if (!r) throw new Error(`Ruta desconocida: ${id}`)
  return r
}
