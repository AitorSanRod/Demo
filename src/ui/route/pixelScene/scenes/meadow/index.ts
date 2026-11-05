// Prado (bioma Meadow, hecho a partir de Ruta 1): colinas al fondo, plantas al borde del camino y un camino ancho.
// Las capas van de la más lejana a la más cercana.

import { StopLandmark } from '../../../../../data/maps'
import type { SceneDef, SceneLayer } from '../../engine/types'
import { house } from '../../elements/house'
import { signpost } from '../../elements/signpost'
import { clouds, farHills, hills, sky, wisps } from './backdrop'
import { backTufts, frontTufts, path, PATH } from './ground'
import { ferns, nearTrees, plants } from './near'
import { GRASS, HOUSE, WOOD } from './palette'
import { meadowParticles } from './particles'
import { farMeadow, meadow } from './plain'

/** Fotogramas del balanceo de la hierba y las plantas */
const SWAY_FRAMES = 6
/** Altura del borde de arriba de la tierra sobre el borde inferior, en píxeles de arte */
const DIRT_TOP = PATH.height - PATH.dirtTop

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

export function meadowScene(seed: number): SceneDef {
  return {
    name: 'Prado',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed)], 128, 0.03, { drift: 3 }),
      layer('far-hills', 'Colinas lejanas', [farHills(seed)], 112, 0.05),
      layer('hills', 'Colinas', [hills(seed)], 104, 0.1),
      layer('far-meadow', 'Llanura lejana', [farMeadow(seed)], 92, 0.15),
      layer('meadow', 'Llanura', [meadow(seed)], 64, 0.27),
      layer('near-trees', 'Árboles cercanos', [nearTrees(seed)], PATH.height - 4, 0.7),
      layer('plants', 'Plantas', plants(seed, SWAY_FRAMES), PATH.height - 3, 0.9, { fps: 4 }),
      layer('path', 'Camino', [path(seed)], 0, 1),
      layer('back-tufts', 'Hierba de atrás', backTufts(seed, SWAY_FRAMES), DIRT_TOP - 3, 1, { fps: 5 }),
      layer('front-tufts', 'Hierba de delante', frontTufts(seed, SWAY_FRAMES), PATH.height - PATH.dirtBottom - 10, 1.15, { fps: 5, plane: 'front' }),
      layer('ferns', 'Hojas en primer plano', ferns(seed, SWAY_FRAMES), -10, 1.6, { fps: 4, plane: 'front' }),
    ],
    particles: meadowParticles(seed),
    landmarks: [
      { id: StopLandmark.Sign, label: 'Cartel', pixmap: signpost('RUTA 1', WOOD, GRASS), parallax: 1, bottom: DIRT_TOP - 8, afterLayer: 'path' },
      { id: StopLandmark.House, label: 'Casa', pixmap: house(HOUSE), parallax: 0.75, bottom: PATH.height - 4, afterLayer: 'near-trees' },
    ],
  }
}
