// Plano cercano del prado: algún árbol suelto, plantas de hoja ancha al borde del camino y hojas de primer plano.

import { daisy } from '../../elements/grass'
import { BROAD_LEAVES, leafFrames, makeClump, type LeafClump } from '../../elements/leaves'
import { broadTree } from '../../elements/trees'
import { between, makeRng, pick } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { BUTTERCUP, DAISY, FERN, GRASS, NEAR_TREES, NEAR_TREES_INK, PLANTS, TRUNK, TRUNK_INK } from './palette'

/** Ancho y alto de la tira de plantas, en píxeles de arte */
const STRIP = { width: 360, height: 40 }
/** Matas por grupo, separación dentro del grupo y hueco entre grupos, en píxeles de arte: [mín, máx] */
const GROUPS = { size: [1, 3], spacing: [12, 20], gap: [24, 70] } as const
/** Balanceo de las hojas, en radianes en la punta */
const PLANT_SWAY = 0.05

export function plants(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 5)
  const clumps: LeafClump[] = []
  for (let x = between(rng, 0, 20); x < STRIP.width - GROUPS.spacing[1]; x += between(rng, ...GROUPS.gap))
    for (let i = Math.round(between(rng, ...GROUPS.size)); i > 0; i--, x += between(rng, ...GROUPS.spacing))
      clumps.push(makeClump(rng, x, between(rng, 18, 36), BROAD_LEAVES))
  const flowers = Array.from({ length: 6 }, () => ({
    x: Math.round(rng() * STRIP.width),
    y: STRIP.height - Math.round(between(rng, 4, 10)),
    colors: pick(rng, [DAISY, DAISY, BUTTERCUP]),
  }))
  return leafFrames(STRIP.width, STRIP.height, clumps, PLANTS, frames, PLANT_SWAY).map((pix) => {
    for (const f of flowers) daisy(pix, f.x, f.y, f.colors, GRASS[1])
    return pix
  })
}

const TREES = { leaves: { colors: NEAR_TREES, ink: NEAR_TREES_INK }, trunk: { colors: TRUNK, ink: TRUNK_INK } }

/**
 * Árboles redondos cercanos, pocos y a distancias irregulares, cada uno de su tamaño: la tesela es ancha para que
 * aparezcan solo de vez en cuando.
 */
export function nearTrees(seed: number): Pixmap {
  const rng = makeRng(seed + 11)
  const pix = new Pixmap(760, 80)
  for (let x = between(rng, 40, 140); x < pix.w - 60; x += between(rng, 160, 320)) {
    const size = Math.round(between(rng, 12, 22))
    broadTree(pix, rng, x, pix.h - 1, size, Math.round(size * between(rng, 0.8, 1.1)), TREES)
  }
  return pix
}

/** Grandes hojas oscuras que pasan de vez en cuando por delante de todo */
export function ferns(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 10)
  const clumps = [makeClump(rng, 60, 46), makeClump(rng, 470, 36)]
  return leafFrames(720, 52, clumps, FERN, frames)
}
