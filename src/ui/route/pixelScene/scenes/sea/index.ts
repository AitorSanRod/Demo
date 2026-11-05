// Mar (bioma Sea, ruta marina): el cielo y las nubes del prado, islotes con palmeras en el horizonte, rocas con
// espuma a media distancia y el agua por la que nada el Pokémon, con crestas que se mueven y espuma delante.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { clouds, sky, wisps } from '../meadow/backdrop'
import { islands, seaRocks } from './islands'
import { FAR_WATER, MID_WATER } from './palette'
import { foam, nearWater, waterBand } from './water'

/** Fotogramas del vaivén del agua y la espuma */
const WAVE_FRAMES = 6
/** Altura del horizonte sobre el borde inferior, en píxeles de arte */
const HORIZON = 122
/** Alto del agua por la que nada el Pokémon */
const SWIM_HEIGHT = 72

const layer = (id: string, label: string, frames: SceneLayer['frames'], offset: number, parallax: number, extra: Partial<SceneLayer> = {}): SceneLayer => ({
  id,
  label,
  frames,
  anchor: 'bottom',
  offset,
  parallax,
  plane: 'back',
  ...extra,
})

export function seaScene(seed: number): SceneDef {
  return {
    name: 'Mar',
    sky,
    walkerBottom: 30,
    surf: true,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed)], HORIZON + 6, 0.03, { drift: 3 }),
      layer('far-water', 'Mar lejano', [waterBand(seed + 1, 480, 30, FAR_WATER)], HORIZON - 30, 0.06),
      layer('islands', 'Islotes', [islands(seed)], HORIZON - 2, 0.06),
      layer('mid-water', 'Mar medio', [waterBand(seed + 2, 420, 30, MID_WATER)], SWIM_HEIGHT - 8, 0.25),
      layer('rocks', 'Rocas', [seaRocks(seed)], SWIM_HEIGHT - 2, 0.25),
      layer('water', 'Agua', nearWater(seed, 520, SWIM_HEIGHT, WAVE_FRAMES), 0, 1, { fps: 3 }),
      layer('foam', 'Espuma', foam(seed, 480, WAVE_FRAMES), -3, 1.2, { fps: 3, plane: 'front' }),
    ],
    landmarks: [],
  }
}
