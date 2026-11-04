// Escenas pixel art por bioma, generadas por código al abrir la primera ruta de ese bioma.
// Los biomas sin escena aquí siguen con el paisaje SVG de ../scenery.

import { Biome } from '../../../data/maps'
import type { SceneDef } from './engine/types'
import { forestScene } from './scenes/forest'
import { meadowScene } from './scenes/meadow'
import { palletTownScene } from './scenes/palletTown'

export { usePixelScene } from './usePixelScene'

/** Píxeles de pantalla por píxel de arte */
export const PIXEL = 3
/** Semilla fija: el mismo paisaje en cada partida */
const SCENE_SEED = 1

const BUILDERS: Partial<Record<Biome, (seed: number) => SceneDef>> = {
  [Biome.Meadow]: meadowScene,
  [Biome.PalletTown]: palletTownScene,
  [Biome.Forest]: forestScene,
}
const cache = new Map<Biome, SceneDef>()

/** Escena pixel art del bioma (se genera una vez y se guarda), o `undefined` si aún no tiene */
export function pixelSceneFor(biome: Biome): SceneDef | undefined {
  const build = BUILDERS[biome]
  if (!build) return undefined
  if (!cache.has(biome)) cache.set(biome, build(SCENE_SEED))
  return cache.get(biome)
}
