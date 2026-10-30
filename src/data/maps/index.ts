import { KANTO } from './kantoMaps'
import type { GameMap, Route } from './mapCommon'

export { KANTO }
export * from './mapCommon'

/** Regiones del juego; una región nueva (su fichero xxxMaps.ts) se añade aquí */
const REGIONS: GameMap[] = [KANTO]

export function route(id: string): Route {
  const r = REGIONS.flatMap((map) => map.routes).find((r) => r.id === id)
  if (!r) throw new Error(`Ruta desconocida: ${id}`)
  return r
}
