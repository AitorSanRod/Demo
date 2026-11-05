// Planos del pueblo: dos filas de casas a distinta distancia sobre césped ondulado (ver elements/houseRow), y
// jardines con valla blanca junto al camino.

import { flowerBed, picketFence } from '../../elements/fence'
import { chimneyTop, house } from '../../elements/house'
import { houseRow, type TownStyle } from '../../elements/houseRow'
import { bush } from '../../elements/shrubs'
import { makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { GRASS, NEAR_TREES, NEAR_TREES_INK, TRUNK, TRUNK_INK } from '../meadow/palette'
import { BED_FLOWERS, BIG_BUILDING, BLUE_HOUSE, FENCE, GARDEN_BUSH, LAWN, MORTAR, ORANGE_HOUSE, PAVING, RED_HOUSE, SAND, SAND_INK, SOIL } from './palette'

/** Edificio grande: ancho a escala 1, en píxeles de arte */
const BIG_WIDTH = 104

const STYLE: TownStyle = {
  houses: [ORANGE_HOUSE, BLUE_HOUSE, RED_HOUSE],
  big: [{ draw: (scale) => house(BIG_BUILDING, BIG_WIDTH, scale), chimney: (scale) => chimneyTop(BIG_WIDTH, scale) }],
  lawn: LAWN,
  trees: { leaves: { colors: NEAR_TREES, ink: NEAR_TREES_INK }, trunk: { colors: TRUNK, ink: TRUNK_INK } },
  street: { fill: SAND[1], top: SAND[0], ink: SAND_INK },
  walkway: { fill: SAND[1], shade: SAND[0], ink: SAND_INK, step: PAVING, mortar: MORTAR },
  /** Humea a ratos (ver engine/smoke.ts) */
  smokeChance: 0.4,
}

/** Casas pequeñas y lejanas, pocas y separadas */
export const farTown = (seed: number) =>
  houseRow(seed + 30, { width: 600, height: 70, lawn: 30, scale: [0.45, 0.6], tree: [5, 7], houses: 3, grass: [1, 2, 3], bigBuilding: false, laneOffset: 10, laneWidth: 3 }, STYLE)

/** Casas medianas más cerca, con el edificio grande */
export const townRow = (seed: number) =>
  houseRow(seed + 20, { width: 560, height: 110, lawn: 44, scale: [0.72, 0.95], tree: [9, 13], houses: 3, grass: [0, 1, 2, 3], bigBuilding: true, laneOffset: 14, laneWidth: 5 }, STYLE)

/** Tramos de jardín: parterre de flores tras una valla blanca, con matas redondas entre tramo y tramo */
export function gardens(seed: number): Pixmap {
  const rng = makeRng(seed + 21)
  const pix = new Pixmap(480, 34)
  const baseY = pix.h - 1
  for (const [x, width] of [[12, 140], [236, 110]]) {
    flowerBed(pix, rng, x + 3, width - 6, baseY - 2, SOIL, GRASS[1], BED_FLOWERS)
    picketFence(pix, x, width, baseY, FENCE)
  }
  bush(pix, rng, 190, baseY, 26, 16, GARDEN_BUSH)
  bush(pix, rng, 400, baseY, 34, 20, GARDEN_BUSH)
  return pix
}
