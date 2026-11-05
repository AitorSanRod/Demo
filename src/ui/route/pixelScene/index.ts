// Escenas pixel art por bioma, generadas por código al abrir la primera ruta de ese bioma.

import { Biome } from '../../../data/maps'
import type { SceneDef } from './engine/types'
import { caveScene } from './scenes/cave'
import { forestScene } from './scenes/forest'
import { meadowScene } from './scenes/meadow'
import { palletTownScene } from './scenes/palletTown'
import { pewterCityScene } from './scenes/pewterCity'
import { seaScene } from './scenes/sea'

export { usePixelScene, type SceneLandmark } from './usePixelScene'

/** Píxeles de pantalla por píxel de arte */
export const PIXEL = 3
/** Semilla fija: el mismo paisaje en cada partida */
const SCENE_SEED = 1

const BUILDERS: Record<Biome, (seed: number) => SceneDef> = {
  [Biome.Meadow]: meadowScene,
  [Biome.PalletTown]: palletTownScene,
  [Biome.PewterCity]: pewterCityScene,
  [Biome.Forest]: forestScene,
  [Biome.Cave]: caveScene,
  [Biome.Sea]: seaScene,
}
const cache = new Map<Biome, SceneDef>()

/** Escena pixel art del bioma (se genera una vez y se guarda) */
export function pixelSceneFor(biome: Biome): SceneDef {
  let scene = cache.get(biome)
  if (!scene) {
    scene = BUILDERS[biome](SCENE_SEED)
    cache.set(biome, scene)
  }
  return scene
}
