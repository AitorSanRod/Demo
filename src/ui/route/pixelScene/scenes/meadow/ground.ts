// Suelo del prado: el camino de tierra y las matas que se mecen en sus bordes.

import { grassField, scatterTufts, tuftFrames, type TuftStyle } from '../../elements/grass'
import { between, hash, makeRng, valueNoise } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ramp } from '../../paint/shade'
import { DAISY, DIRT, DIRT_INK, GRASS, GRASS_INK } from './palette'

/** Filas del camino (de arriba abajo): hierba del fondo, tierra y hierba de delante */
export const PATH = { height: 72, dirtTop: 8, dirtBottom: 60 }

const FIELD = [GRASS[1], GRASS[2], GRASS[4]]
/** Manchas claras de la tierra: tamaño de celda del ruido, en píxeles de arte */
const PATCH_CELL = 24
/** Ancho de la tesela del camino: larga para que las manchas no se repitan a la vista */
const PATH_WIDTH = 960

/** Briznas que cuelgan de la hierba sobre la tierra: cuántos píxeles baja cada columna */
const blade = (x: number, seed: number) => (hash(x, 3, seed) < 0.4 ? 1 + Math.floor(hash(x, 4, seed) * 3) : 0)

export function path(seed: number): Pixmap {
  const rng = makeRng(seed + 7)
  const pix = new Pixmap(PATH_WIDTH, PATH.height)
  grassField(pix, rng, 0, PATH.dirtTop, FIELD)
  grassField(pix, rng, PATH.dirtBottom, PATH.height - PATH.dirtBottom, FIELD)
  for (let x = 0; x < pix.w; x++) {
    for (let y = PATH.dirtTop; y < PATH.dirtBottom; y++) {
      const patch = valueNoise(x, y * 3, PATCH_CELL, pix.w, seed) + (hash(x, y, seed) - 0.5) * 0.08
      const shadow = y < PATH.dirtTop + 3 ? 0.4 : 0
      pix.set(x, y, ramp(DIRT, 0.25 + patch * 0.75 - shadow, x, y, 0))
    }
    pix.set(x, PATH.dirtTop, GRASS_INK)
    for (let k = 1; k <= blade(x, seed); k++) pix.set(x, PATH.dirtTop + k, k === blade(x, seed) ? GRASS_INK : GRASS[1])
    const up = blade(x, seed + 1)
    for (let k = 0; k <= up; k++) pix.set(x, PATH.dirtBottom - k, k === up ? GRASS[3] : GRASS[2])
  }
  for (let i = 0; i < 60; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(between(rng, PATH.dirtTop + 6, PATH.dirtBottom - 4))
    const w = rng() < 0.5 ? 2 : 3
    pix.rect(x, y, w, 1, DIRT_INK)
    pix.rect(x, y - 1, w - 1, 1, DIRT[3])
  }
  return pix
}

const BACK_TUFTS: TuftStyle = { grass: GRASS, minHeight: 3, maxHeight: 9, sway: 1.5 }
const FRONT_TUFTS: TuftStyle = { grass: GRASS, minHeight: 5, maxHeight: 13, sway: 2 }

/** Matas al borde de atrás del camino, que se mecen */
export function backTufts(seed: number, frames: number): Pixmap[] {
  const tufts = scatterTufts(makeRng(seed + 8), 160, 20, BACK_TUFTS, [DAISY])
  return tuftFrames(160, 14, tufts, BACK_TUFTS, frames)
}

/** Matas al borde de delante del camino, por delante del Pokémon */
export function frontTufts(seed: number, frames: number): Pixmap[] {
  const tufts = scatterTufts(makeRng(seed + 9), 200, 18, FRONT_TUFTS, [DAISY])
  return tuftFrames(200, 18, tufts, FRONT_TUFTS, frames)
}
