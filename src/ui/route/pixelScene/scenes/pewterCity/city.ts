// Planos de la ciudad: dos filas de edificios de piedra de varias plantas sobre césped (ver elements/houseRow),
// y el paseo junto al camino con farolas, setos recortados y algún árbol.

import { houseRow, type TownStyle } from '../../elements/houseRow'
import { lamppost } from '../../elements/lamppost'
import { trimmedHedge } from '../../elements/shrubs'
import { broadTree } from '../../elements/trees'
import { between, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { TRUNK, TRUNK_INK } from '../meadow/palette'
import { HEDGE, LAMP, LAWN, MORTAR, MUSEUM, PAVING, RUST_HOUSE, SLATE_HOUSE, TEAL_HOUSE, TREES, TREES_INK } from './palette'

const TREE_PALETTE = { leaves: { colors: TREES, ink: TREES_INK }, trunk: { colors: TRUNK, ink: TRUNK_INK } }

const STYLE: TownStyle = {
  houses: [SLATE_HOUSE, TEAL_HOUSE, RUST_HOUSE],
  /** El museo: ancho a escala 1, en píxeles de arte */
  big: { palette: MUSEUM, width: 120 },
  lawn: LAWN,
  trees: TREE_PALETTE,
  street: { fill: PAVING[1], top: PAVING[0], ink: MORTAR },
  walkway: { fill: PAVING[2], shade: PAVING[0], ink: MORTAR, step: PAVING, mortar: MORTAR },
  /** Humea a ratos (ver engine/smoke.ts) */
  smokeChance: 0.3,
  floors: [1, 3],
}
/** Al fondo, edificios más altos (el centro de la ciudad) */
const FAR_STYLE: TownStyle = { ...STYLE, floors: [2, 3] }

/** Edificios pequeños y lejanos, más juntos que en el pueblo */
export const farCity = (seed: number) =>
  houseRow(seed + 30, { width: 560, height: 80, lawn: 28, scale: [0.42, 0.55], tree: [5, 7], houses: 8, grass: [1, 2, 3], bigBuilding: false, laneOffset: 10, laneWidth: 3 }, FAR_STYLE)

/** Edificios medianos más cerca, con el museo */
export const cityRow = (seed: number) =>
  houseRow(seed + 20, { width: 600, height: 130, lawn: 44, scale: [0.7, 0.88], tree: [9, 12], houses: 6, grass: [0, 1, 2, 3], bigBuilding: true, laneOffset: 14, laneWidth: 6 }, STYLE)

/** Paseo: tesela ancha y separación entre farolas, en píxeles de arte */
const BOULEVARD = { width: 540, lampGap: [110, 160] as const }

/** Farolas a distancias variadas con setos recortados entre ellas y, de tarde en tarde, un árbol */
export function boulevard(seed: number): Pixmap {
  const rng = makeRng(seed + 21)
  const pix = new Pixmap(BOULEVARD.width, 48)
  const groundY = pix.h - 1
  broadTree(pix, rng, 330, groundY, 13, 9, TREE_PALETTE)
  const lamps: number[] = []
  for (let x = 30; x < pix.w - 40; x += between(rng, ...BOULEVARD.lampGap)) lamps.push(Math.round(x))
  for (const x of lamps) lamppost(pix, x, groundY, LAMP)
  lamps.forEach((x, i) => {
    const next = lamps[i + 1] ?? pix.w + lamps[0]
    const width = Math.round(between(rng, 0.35, 0.55) * (next - x))
    const from = Math.round(x + between(rng, 10, next - x - width - 10))
    if (Math.abs(from + width / 2 - 330) > 40) trimmedHedge(pix, rng, from, width, groundY, Math.round(between(rng, 9, 12)), HEDGE)
  })
  return pix
}
