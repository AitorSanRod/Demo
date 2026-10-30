import type { Biome } from '../../../data/maps'
import { cave } from './cave'
import type { Scene } from './draw'
import { forest } from './forest'
import { meadow } from './meadow'
import { sea } from './sea'

export { SCALE, type SceneLayer } from './draw'

/** Escena de cada bioma; un bioma nuevo en data/maps.ts necesita aquí su escena */
export const SCENES: Record<Biome, Scene> = { meadow, forest, cave, sea }
