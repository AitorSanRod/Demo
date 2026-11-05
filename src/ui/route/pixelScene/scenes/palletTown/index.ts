// Pueblo Paleta (bioma PalletTown, solo para esa ruta): el cielo y las colinas del prado, una fila de casas al fondo,
// jardines con valla blanca junto al camino y un camino de arena con un tramo de plaza empedrada.

import { StopLandmark } from '../../../../../data/maps'
import type { SceneDef, SceneLayer } from '../../engine/types'
import { fountain } from '../../elements/fountain'
import { house } from '../../elements/house'
import { signpost } from '../../elements/signpost'
import { clouds, farHills, hills, sky, wisps } from '../meadow/backdrop'
import { backTufts, frontTufts, PATH } from '../meadow/ground'
import { GRASS, WOOD } from '../meadow/palette'
import { meadowParticles } from '../meadow/particles'
import { townPath } from './ground'
import { FOUNTAIN, RED_HOUSE } from './palette'
import { farTown, gardens, townRow } from './town'

/** Fotogramas del balanceo de la hierba */
const SWAY_FRAMES = 6
/** Altura del borde de arriba del camino sobre el borde inferior, en píxeles de arte */
const PATH_TOP = PATH.height - PATH.dirtTop

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

export function palletTownScene(seed: number): SceneDef {
  const far = farTown(seed)
  const near = townRow(seed)
  return {
    name: 'Pueblo Paleta',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed)], 128, 0.03, { drift: 3 }),
      layer('far-hills', 'Colinas lejanas', [farHills(seed)], 112, 0.05),
      layer('hills', 'Colinas', [hills(seed)], 104, 0.1),
      layer('far-town', 'Casas lejanas', [far.pixmap], 90, 0.18, { emitters: far.emitters }),
      layer('town', 'Casas', [near.pixmap], 60, 0.32, { emitters: near.emitters }),
      layer('gardens', 'Jardines', [gardens(seed)], PATH.height - 2, 0.7),
      layer('path', 'Camino y plaza', [townPath(seed)], 0, 1),
      layer('back-tufts', 'Hierba de atrás', backTufts(seed, SWAY_FRAMES), PATH_TOP - 3, 1, { fps: 5 }),
      layer('front-tufts', 'Hierba de delante', frontTufts(seed, SWAY_FRAMES), PATH.height - PATH.dirtBottom - 10, 1.15, { fps: 5, plane: 'front' }),
    ],
    particles: meadowParticles(seed),
    landmarks: [
      { id: StopLandmark.Sign, label: 'Cartel', pixmap: signpost('PUEBLO PALETA', WOOD, GRASS), parallax: 1, bottom: PATH_TOP - 8, afterLayer: 'path' },
      { id: StopLandmark.House, label: 'Casa', pixmap: house(RED_HOUSE), parallax: 0.75, bottom: PATH.height - 2, afterLayer: 'town' },
      { id: StopLandmark.Fountain, label: 'Fuente', pixmap: fountain(FOUNTAIN), parallax: 1, bottom: PATH_TOP - 14, afterLayer: 'path' },
    ],
  }
}
