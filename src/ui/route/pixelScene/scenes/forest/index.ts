// Bosque Verde (bioma Forest): bosque cerrado con claros. Bruma al fondo, dos planos de árboles, copas que tapan el
// cielo salvo en los claros (con rayos de luz), árboles grandes junto al camino, sotobosque y camino de tierra húmeda.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { hollowLog } from '../../elements/log'
import { signpost } from '../../elements/signpost'
import { PATH } from '../meadow/ground'
import { canopy, farForest, midForest, rays, sky } from './backdrop'
import { backTufts, forestPath, frontTufts } from './ground'
import { bigTrees, ferns, undergrowth } from './near'
import { FOREST_GRASS, LOG, WOOD } from './palette'

/** Fotogramas del balanceo de la hierba y los helechos */
const SWAY_FRAMES = 6
/** Altura del borde de arriba del camino sobre el borde inferior, en píxeles de arte */
const PATH_TOP = PATH.height - PATH.dirtTop
/** Las copas y los rayos van juntos (misma tesela y misma velocidad) para que la luz salga de los claros */
const CANOPY_PARALLAX = 0.4

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

export function forestScene(seed: number): SceneDef {
  return {
    name: 'Bosque Verde',
    sky,
    walkerBottom: 34,
    layers: [
      layer('far-forest', 'Árboles lejanos', [farForest(seed)], 70, 0.1),
      layer('mid-forest', 'Árboles medios', [midForest(seed)], 62, 0.22),
      layer('rays', 'Rayos de luz', [rays(seed)], 0, CANOPY_PARALLAX, { anchor: 'top' }),
      layer('canopy', 'Copas', [canopy(seed)], 0, CANOPY_PARALLAX, { anchor: 'top' }),
      layer('big-trees', 'Árboles grandes', [bigTrees(seed)], PATH.height - 6, 0.6),
      layer('undergrowth', 'Sotobosque', undergrowth(seed, SWAY_FRAMES), PATH.height - 3, 0.75, { fps: 4 }),
      layer('path', 'Camino', [forestPath(seed)], 0, 1),
      layer('back-tufts', 'Hierba de atrás', backTufts(seed, SWAY_FRAMES), PATH_TOP - 3, 1, { fps: 5 }),
      layer('front-tufts', 'Hierba de delante', frontTufts(seed, SWAY_FRAMES), PATH.height - PATH.dirtBottom - 10, 1.15, { fps: 5, plane: 'front' }),
      layer('ferns', 'Hojas en primer plano', ferns(seed, SWAY_FRAMES), -10, 1.6, { fps: 4, plane: 'front' }),
    ],
    landmarks: [
      { id: 'log', label: 'Tronco hueco', pixmap: hollowLog(LOG), parallax: 1, bottom: PATH_TOP - 10, afterLayer: 'back-tufts' },
      { id: 'sign', label: 'Cartel', pixmap: signpost('BOSQUE VERDE', WOOD, FOREST_GRASS), parallax: 1, bottom: PATH_TOP - 8, afterLayer: 'path' },
    ],
  }
}
