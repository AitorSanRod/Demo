import type { Biome } from '../../../data/maps'
import { cave } from './cave'
import type { Scene } from './draw'
import { sea } from './sea'

export { SCALE, type SceneLayer } from './draw'

/**
 * Paisaje SVG de los biomas que aún no tienen escena pixel art (ver ../pixelScene). Un bioma nuevo en
 * data/maps/mapCommon.ts necesita escena en uno de los dos sitios.
 */
const SCENES: Partial<Record<Biome, Scene>> = { cave, sea }

export const svgSceneFor = (biome: Biome): Scene | undefined => SCENES[biome]
