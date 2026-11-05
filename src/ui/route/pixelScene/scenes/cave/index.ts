// Cueva (bioma Cave, Monte Moon): penumbra violeta, techo con estalactitas, paredes de roca a dos distancias,
// peñascos con cristales que brillan junto al camino y suelo de roca con charcos.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { PATH } from '../meadow/ground'
import { ceiling, farWall, midWall, sky } from './backdrop'
import { cavePath } from './ground'
import { foreground, nearRocks } from './near'
import { FAR_ROCK } from './palette'

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

export function caveScene(seed: number): SceneDef {
  return {
    name: 'Cueva',
    sky,
    walkerBottom: 34,
    layers: [
      layer('far-ceiling', 'Techo lejano', [ceiling(seed, 400, 30, [10, 24])], 0, 0.08, { anchor: 'top' }),
      layer('far-wall', 'Pared del fondo', [farWall(seed)], 56, 0.1),
      layer('mid-wall', 'Pared media', [midWall(seed)], 58, 0.22),
      layer('ceiling', 'Techo', [ceiling(seed, 480, 22, [16, 40], FAR_ROCK)], 0, 0.35, { anchor: 'top' }),
      layer('near-rocks', 'Peñascos', [nearRocks(seed)], PATH.height - 6, 0.6),
      layer('path', 'Suelo', [cavePath(seed)], 0, 1),
      layer('foreground', 'Rocas en primer plano', [foreground(seed)], -6, 1.4, { plane: 'front' }),
    ],
    landmarks: [],
  }
}
