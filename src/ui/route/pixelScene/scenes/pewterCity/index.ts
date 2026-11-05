// Ciudad Plateada al atardecer: sol bajo tras montañas rocosas, dos filas de edificios de piedra de varias plantas,
// un paseo con farolas encendidas y setos recortados, y una calle de losas de piedra.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { fountain } from '../../elements/fountain'
import { house } from '../../elements/house'
import { signpost } from '../../elements/signpost'
import { PATH } from '../meadow/ground'
import { clouds, farMountains, mountains, sky, sun, wisps } from './backdrop'
import { boulevard, cityRow, farCity } from './city'
import { cityPath } from './ground'
import { FOUNTAIN, LAWN, MUSEUM, WOOD } from './palette'

/** Altura del borde de arriba de la calle sobre el borde inferior, en píxeles de arte */
const PATH_TOP = PATH.height - PATH.dirtTop
/** Plantas del edificio de la parada «Museo» */
const MUSEUM_FLOORS = 2

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

export function pewterCityScene(seed: number): SceneDef {
  const far = farCity(seed)
  const near = cityRow(seed)
  return {
    name: 'Ciudad Plateada',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 14, drift: 1.5 }),
      layer('sun', 'Sol', [sun()], 124, 0.01),
      layer('clouds', 'Nubes', [clouds(seed)], 134, 0.03, { drift: 2 }),
      layer('far-mountains', 'Montañas lejanas', [farMountains(seed)], 110, 0.05),
      layer('mountains', 'Montañas', [mountains(seed)], 100, 0.1),
      layer('far-city', 'Edificios lejanos', [far.pixmap], 86, 0.18, { emitters: far.emitters }),
      layer('city', 'Edificios', [near.pixmap], 56, 0.32, { emitters: near.emitters }),
      layer('boulevard', 'Paseo', [boulevard(seed)], PATH.height - 4, 0.7),
      layer('path', 'Calle', [cityPath(seed)], 0, 1),
    ],
    landmarks: [
      { id: 'sign', label: 'Cartel', pixmap: signpost('CIUDAD PLATEADA', WOOD, LAWN), parallax: 1, bottom: PATH_TOP - 8, afterLayer: 'path' },
      { id: 'museum', label: 'Museo', pixmap: house(MUSEUM, 120, 1, MUSEUM_FLOORS), parallax: 0.7, bottom: PATH.height - 4, afterLayer: 'city' },
      { id: 'fountain', label: 'Fuente', pixmap: fountain(FOUNTAIN), parallax: 1, bottom: PATH_TOP - 14, afterLayer: 'path' },
    ],
  }
}
