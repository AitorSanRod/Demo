// Suelo del Bosque Verde: tierra oscura y húmeda con manchas suaves, raíces que la cruzan de tarde en tarde y hojas
// caídas; y las matas de hierba que se mecen en los bordes.

import { grassField, scatterTufts, tuftFrames, type TuftStyle } from '../../elements/grass'
import { between, hash, makeRng, pick, valueNoise, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ramp } from '../../paint/shade'
import { PATH } from '../meadow/ground'
import { DARK_DIRT, DARK_DIRT_INK, FALLEN_LEAVES, FOREST_GRASS, FOREST_GRASS_INK, NEAR_TRUNK } from './palette'

/** Manchas de la tierra: tamaño de celda del ruido, en píxeles de arte */
const PATCH_CELL = 28
/** Tesela del camino: larga para que las raíces aparezcan de tarde en tarde */
const PATH_WIDTH = 1200
/** Separación entre raíces que cruzan el camino, en píxeles de arte: [mín, máx] */
const ROOT_GAP = [220, 420] as const
const FIELD = [FOREST_GRASS[1], FOREST_GRASS[2], FOREST_GRASS[4]]

const blade = (x: number, seed: number) => (hash(x, 3, seed) < 0.45 ? 1 + Math.floor(hash(x, 4, seed) * 3) : 0)

/** Raíz que sale del borde de atrás y baja en curva por el camino, afinándose; a ratos se hunde en la tierra */
function root(pix: Pixmap, rng: Rng, x0: number) {
  const length = between(rng, 26, 50)
  const drop = between(rng, 10, 22)
  const [ink, shade, base, light] = [NEAR_TRUNK.ink, NEAR_TRUNK.colors[1], NEAR_TRUNK.colors[2], NEAR_TRUNK.colors[3]]
  for (let i = 0; i < length; i++) {
    const k = i / length
    if (k > 0.35 && k < 0.5) continue
    const x = Math.round(x0 + i)
    const y = Math.round(PATH.dirtTop + 1 + drop * Math.sin((k * Math.PI) / 2))
    const thick = Math.max(1, Math.round(3 * (1 - k)))
    pix.set(x, y - 1, light)
    for (let t = 0; t < thick; t++) pix.set(x, y + t, t === 0 ? base : shade)
    pix.set(x, y + thick, ink)
  }
}

export function forestPath(seed: number): Pixmap {
  const rng = makeRng(seed + 70)
  const pix = new Pixmap(PATH_WIDTH, PATH.height)
  grassField(pix, rng, 0, PATH.dirtTop, FIELD)
  grassField(pix, rng, PATH.dirtBottom, PATH.height - PATH.dirtBottom, FIELD)
  for (let x = 0; x < pix.w; x++) {
    for (let y = PATH.dirtTop; y < PATH.dirtBottom; y++) {
      const patch = valueNoise(x, y * 3, PATCH_CELL, pix.w, seed) + (hash(x, y, seed) - 0.5) * 0.06
      const shadow = y < PATH.dirtTop + 4 ? 0.4 : 0
      pix.set(x, y, ramp(DARK_DIRT, 0.2 + patch * 0.7 - shadow, x, y, 0))
    }
    pix.set(x, PATH.dirtTop, FOREST_GRASS_INK)
    for (let k = 1; k <= blade(x, seed); k++) pix.set(x, PATH.dirtTop + k, k === blade(x, seed) ? FOREST_GRASS_INK : FOREST_GRASS[1])
    const up = blade(x, seed + 1)
    for (let k = 0; k <= up; k++) pix.set(x, PATH.dirtBottom - k, k === up ? FOREST_GRASS[3] : FOREST_GRASS[2])
  }
  for (let x = between(rng, 40, 160); x < pix.w - 60; x += between(rng, ...ROOT_GAP)) root(pix, rng, x)
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(between(rng, PATH.dirtTop + 6, PATH.dirtBottom - 3))
    if (rng() < 0.6) pix.rect(x, y, 2, 1, pick(rng, FALLEN_LEAVES))
    else {
      pix.rect(x, y, 2, 1, DARK_DIRT_INK)
      pix.set(x, y - 1, DARK_DIRT[3])
    }
  }
  return pix
}

const BACK_TUFTS: TuftStyle = { grass: FOREST_GRASS, minHeight: 3, maxHeight: 9, sway: 1.5 }
const FRONT_TUFTS: TuftStyle = { grass: FOREST_GRASS, minHeight: 5, maxHeight: 13, sway: 2 }

/** Matas al borde de atrás del camino, que se mecen */
export function backTufts(seed: number, frames: number): Pixmap[] {
  const tufts = scatterTufts(makeRng(seed + 71), 180, 22, BACK_TUFTS, [])
  return tuftFrames(180, 14, tufts, BACK_TUFTS, frames)
}

/** Matas al borde de delante del camino, por delante del Pokémon */
export function frontTufts(seed: number, frames: number): Pixmap[] {
  const tufts = scatterTufts(makeRng(seed + 72), 220, 18, FRONT_TUFTS, [])
  return tuftFrames(220, 18, tufts, FRONT_TUFTS, frames)
}
