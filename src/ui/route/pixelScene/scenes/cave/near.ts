// Planos cercanos de la cueva: peñascos y estalagmitas junto al camino con racimos de cristales que brillan, y
// rocas oscuras en primer plano que pasan por delante del Pokémon.

import { boulder, crystals, spike } from '../../elements/rocks'
import { between, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { CEILING, CRYSTAL, NEAR_ROCK } from './palette'

/** Tesela de los peñascos y separación entre grupos, en píxeles de arte */
const NEAR = { width: 560, gap: [70, 120] as const }

/** Grupos de peñascos con una estalagmita detrás de algunos; uno de cada tres lleva cristales */
export function nearRocks(seed: number): Pixmap {
  const rng = makeRng(seed + 11)
  const pix = new Pixmap(NEAR.width, 80)
  const groundY = pix.h - 1
  let i = 0
  for (let x = between(rng, 10, 40); x < pix.w - 30; x += between(rng, ...NEAR.gap), i++) {
    if (rng() < 0.5) spike(pix, x + between(rng, -8, 8), groundY - 4, Math.round(between(rng, 30, 52)), Math.round(between(rng, 12, 18)), NEAR_ROCK, false)
    if (i % 3 === 1) crystals(pix, rng, x + between(rng, 12, 20), groundY - 2, Math.round(between(rng, 20, 28)), CRYSTAL)
    boulder(pix, rng, x, groundY, Math.round(between(rng, 16, 26)), NEAR_ROCK)
  }
  return pix
}

/** Rocas oscuras, bajas y de tarde en tarde, en primer plano */
export function foreground(seed: number): Pixmap {
  const rng = makeRng(seed + 13)
  const pix = new Pixmap(700, 24)
  for (const x of [80, 330, 520]) boulder(pix, rng, x + between(rng, -30, 30), pix.h - 1, Math.round(between(rng, 9, 14)), CEILING)
  return pix
}
