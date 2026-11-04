// Plano cercano del Bosque Verde: árboles grandes que enmarcan el camino (la copa se sale por arriba) y el
// sotobosque en grupos con huecos: arbustos, rocas con musgo, helechos que se mecen y setas.

import { BROAD_LEAVES, FERN_LEAVES, leafFrames, makeClump, type LeafClump } from '../../elements/leaves'
import { mushroom } from '../../elements/mushroom'
import { bush, mossyRock } from '../../elements/shrubs'
import { forestTree } from '../../elements/forestTree'
import { between, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { FERN, FOREST_GRASS, MUSHROOM, NEAR_LEAVES, NEAR_TRUNK, ROCK } from './palette'

/** Ancho y alto de la tira de sotobosque, en píxeles de arte */
const UNDERGROWTH = { width: 640, height: 44 }
/** Hueco entre grupos de sotobosque, en píxeles de arte: [mín, máx] */
const GROUP_GAP = [36, 90] as const
/** Balanceo de los helechos, en radianes en la punta */
const FERN_SWAY = 0.05
const UNDERGROWTH_FERN = [FOREST_GRASS[0], FOREST_GRASS[1], FOREST_GRASS[3], FOREST_GRASS[4]]

/** Árboles grandes, cada uno distinto (inclinación, ramas, copa), escasos y a distancias irregulares */
export function bigTrees(seed: number): Pixmap {
  const rng = makeRng(seed + 60)
  const pix = new Pixmap(1300, 280)
  for (let x = between(rng, 80, 180); x < pix.w - 100; x += between(rng, 300, 520)) {
    const size = Math.round(between(rng, 34, 46))
    forestTree(pix, rng, x, pix.h - 1, size, Math.round(between(rng, 80, 110)), { leaves: NEAR_LEAVES, trunk: NEAR_TRUNK })
  }
  return pix
}

/** Un grupo de sotobosque alrededor de `cx`: arbusto y roca detrás, helechos y setas delante */
function group(rng: Rng, back: Pixmap, cx: number, ferns: LeafClump[], shrooms: [number, number][]) {
  const baseY = back.h - 1
  if (rng() < 0.85) bush(back, rng, cx + between(rng, -10, 10), baseY, between(rng, 26, 46), between(rng, 18, 30), NEAR_LEAVES)
  if (rng() < 0.4) mossyRock(back, rng, cx + between(rng, -16, 16), baseY, Math.round(between(rng, 5, 8)), ROCK, [FOREST_GRASS[1], FOREST_GRASS[3], FOREST_GRASS[4]])
  for (let i = Math.round(between(rng, 1, 3)); i > 0; i--) ferns.push(makeClump(rng, cx + between(rng, -18, 18), between(rng, 16, 28), rng() < 0.5 ? FERN_LEAVES : BROAD_LEAVES))
  if (rng() < 0.5) for (let i = Math.round(between(rng, 1, 3)); i > 0; i--) shrooms.push([Math.round(cx + between(rng, -14, 14)), Math.round(between(rng, 3, 5))])
}

/** Sotobosque en grupos con huecos entre medias; los helechos se mecen y lo demás queda quieto */
export function undergrowth(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 61)
  const back = new Pixmap(UNDERGROWTH.width, UNDERGROWTH.height)
  const ferns: LeafClump[] = []
  const shrooms: [number, number][] = []
  for (let x = between(rng, 10, 40); x < UNDERGROWTH.width - 20; x += between(rng, ...GROUP_GAP)) group(rng, back, x, ferns, shrooms)
  return leafFrames(UNDERGROWTH.width, UNDERGROWTH.height, ferns, UNDERGROWTH_FERN, frames, FERN_SWAY).map((leaves) => {
    const frame = new Pixmap(UNDERGROWTH.width, UNDERGROWTH.height)
    frame.stamp(back, 0, 0)
    frame.stamp(leaves, 0, 0)
    for (const [x, size] of shrooms) mushroom(frame, x, UNDERGROWTH.height - 1, size, MUSHROOM)
    return frame
  })
}

/** Grandes hojas oscuras que pasan de vez en cuando por delante de todo */
export function ferns(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 62)
  const clumps = [makeClump(rng, 80, 48), makeClump(rng, 560, 40)]
  return leafFrames(820, 54, clumps, FERN, frames)
}
