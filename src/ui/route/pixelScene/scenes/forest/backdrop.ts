// Fondo del Bosque Verde: bruma, dos planos de árboles a distinta distancia, la banda de copas de arriba con sus
// claros y los rayos de luz que entran por ellos (copas y rayos comparten tesela y claros para ir alineados).

import { canopyBand, distantTree, lightRays, type Clearing } from '../../elements/forest'
import { lawn } from '../../elements/lawn'
import { hedge } from '../../elements/shrubs'
import { between, makeRng } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { verticalGradient } from '../../paint/shade'
import { CANOPY, FAR_LEAVES, FAR_TRUNKS, FLOOR, HAZE, MID_LEAVES, MID_TRUNKS, RAY } from './palette'

/** Tesela de la banda de copas y de los rayos, y sus claros, en píxeles de arte (los claros salen de tarde en tarde) */
export const CANOPY_TILE = 900
const CLEARINGS: Clearing[] = [{ from: 300, to: 420 }, { from: 720, to: 790 }]

export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, HAZE, 0, height, 0)
  return pix
}

interface Stand {
  width: number
  height: number
  /** Alto del suelo de musgo al pie */
  floor: number
  trunk: [number, number]
  /** Separación entre árboles: [mín, máx] */
  gap: [number, number]
  trunks: readonly Color[]
  floorColors: readonly Color[]
  /** Alto del matorral al pie de los árboles: [mín, máx] */
  brush: [number, number]
}

/**
 * Fila de árboles de fondo sobre su franja de musgo: a distancias irregulares, con las copas a distinta altura (alguno
 * con una segunda copa más baja) y una fila de matorral al pie, para que no queden huecos vacíos de bruma.
 */
function stand(seed: number, s: Stand, leaves: typeof FAR_LEAVES): Pixmap {
  const rng = makeRng(seed)
  const pix = new Pixmap(s.width, s.height)
  const top = lawn(pix, rng, s.floor, s.floorColors, seed)
  const ground = pix.h - s.floor
  for (let x = between(rng, 0, 30); x < pix.w - 10; x += between(rng, ...s.gap)) {
    const width = Math.round(between(rng, ...s.trunk))
    const crownY = Math.round(between(rng, ground * 0.2, ground * 0.55))
    distantTree(pix, rng, x, top(x) + 2, width, crownY, s.trunks, leaves)
    if (rng() < 0.5) distantTree(pix, rng, x, top(x) + 2, width, Math.round(between(rng, crownY + 24, ground * 0.85)), s.trunks, leaves)
  }
  hedge(pix, rng, 0, pix.w, ground + 4, s.brush, leaves)
  return pix
}

export const farForest = (seed: number) =>
  stand(seed + 50, { width: 520, height: 170, floor: 22, trunk: [5, 9], gap: [16, 30], brush: [12, 22], trunks: FAR_TRUNKS, floorColors: [FLOOR[2], FLOOR[3], FAR_TRUNKS[2]] }, FAR_LEAVES)

export const midForest = (seed: number) =>
  stand(seed + 51, { width: 640, height: 150, floor: 18, trunk: [13, 20], gap: [40, 70], brush: [18, 32], trunks: MID_TRUNKS, floorColors: FLOOR }, MID_LEAVES)

/** Copas que cuelgan del borde de arriba, abiertas en los claros */
export function canopy(seed: number): Pixmap {
  const pix = new Pixmap(CANOPY_TILE, 84)
  canopyBand(pix, makeRng(seed + 52), pix.h, CLEARINGS, CANOPY)
  return pix
}

/** Rayos de luz bajo los claros de la banda de copas */
export function rays(seed: number): Pixmap {
  const pix = new Pixmap(CANOPY_TILE, 200)
  lightRays(pix, makeRng(seed + 53), CLEARINGS, RAY.color, RAY.alpha)
  return pix
}
