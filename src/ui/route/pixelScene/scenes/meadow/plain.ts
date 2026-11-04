// Llanura del prado en dos planos: el lejano con grupitos de árboles pequeños y el cercano cruzado por un sendero de
// tierra, con árboles sueltos y matas. Nada alineado: posiciones, tamaños y profundidades al azar, y los árboles más
// al fondo, más pequeños.

import { lane, lawn } from '../../elements/lawn'
import { bush } from '../../elements/shrubs'
import { broadTree, type TreePalette } from '../../elements/trees'
import { between, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { DIRT, MEADOW, MEADOW_TREES, TRUNK, TRUNK_INK } from './palette'

const TREES: TreePalette = { leaves: { colors: MEADOW_TREES, ink: MEADOW_TREES[0] }, trunk: { colors: TRUNK, ink: TRUNK_INK } }
/** Sendero lejano: tonos claros de la tierra, para que no destaque tanto como el camino */
const TRAIL = { fill: DIRT[3], top: DIRT[2], ink: DIRT[1] }

interface Planted {
  x: number
  y: number
  size: number
}

/** Árboles de un grupo: a más profundidad (más abajo en el césped), más grandes; se pintan de atrás adelante */
function grove(rng: Rng, cx: number, top: (x: number) => number, count: number, size: [number, number], depth: number): Planted[] {
  return Array.from({ length: count }, () => {
    const x = Math.round(cx + between(rng, -count * 6, count * 6))
    const d = rng()
    return { x, y: top(x) + 2 + Math.round(d * depth), size: Math.round(size[0] + d * (size[1] - size[0])) }
  })
}

function plant(pix: Pixmap, rng: Rng, trees: Planted[]) {
  for (const t of [...trees].sort((a, b) => a.y - b.y)) broadTree(pix, rng, t.x, t.y, t.size, Math.round(t.size * 0.8), TREES)
}

/** Plano lejano: césped claro con dos o tres grupitos de árboles pequeños repartidos sin orden */
export function farMeadow(seed: number): Pixmap {
  const rng = makeRng(seed + 40)
  const pix = new Pixmap(640, 58)
  const top = lawn(pix, rng, 32, [MEADOW[1], MEADOW[2], MEADOW[3]], seed + 41)
  const groups = Math.round(between(rng, 2, 4))
  const trees = Array.from({ length: groups }, (_, i) => {
    const cx = ((i + between(rng, 0.1, 0.8)) * pix.w) / groups
    return grove(rng, cx, top, Math.round(between(rng, 1, 4)), [4, 7], 14)
  }).flat()
  plant(pix, rng, trees)
  return pix
}

/** Plano cercano: césped degradado con un sendero de tierra ondulado, árboles sueltos y alguna mata */
export function meadow(seed: number): Pixmap {
  const rng = makeRng(seed + 42)
  const pix = new Pixmap(720, 70)
  const top = lawn(pix, rng, 46, MEADOW, seed + 43)
  const trailY = lane(pix, top, 16, 3, TRAIL, 4, rng() * Math.PI * 2)
  const trees = Array.from({ length: Math.round(between(rng, 2, 4)) }, () => {
    const x = Math.round(rng() * pix.w)
    const behind = rng() < 0.5
    const y = behind ? trailY(x) - Math.round(between(rng, 2, 8)) : trailY(x) + Math.round(between(rng, 8, 22))
    return { x, y, size: behind ? Math.round(between(rng, 7, 10)) : Math.round(between(rng, 10, 14)) }
  })
  plant(pix, rng, trees)
  for (let i = 0; i < 2; i++) {
    const x = Math.round(rng() * pix.w)
    bush(pix, rng, x, trailY(x) + Math.round(between(rng, 10, 20)), between(rng, 14, 22), between(rng, 8, 12), TREES.leaves)
  }
  return pix
}
