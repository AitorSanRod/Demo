// Fondo de la cueva: penumbra violeta, paredes de roca a dos distancias y el techo con estalactitas, que tapa la
// parte de arriba de la pantalla (en una cueva nunca se ve el cielo).

import { crystals, rockMass, spike } from '../../elements/rocks'
import type { Inked } from '../../elements/trees'
import { between, makeRng, periodicWave, valueNoise } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ramp, verticalGradient } from '../../paint/shade'
import { CEILING, FAR_CRYSTAL, FAR_ROCK, GLOOM, MID_ROCK } from './palette'

export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, GLOOM, 0, height, 0)
  return pix
}

/** Pared del fondo, alta y oscura, con algún racimo de cristales apagados al pie */
export function farWall(seed: number): Pixmap {
  const rng = makeRng(seed + 2)
  const pix = new Pixmap(420, 150)
  const p = () => rng() * Math.PI * 2
  rockMass(pix, 100, [[2, 22, p()], [5, 9, p()], [9, 3, p()]], FAR_ROCK.colors, seed)
  for (const x of [90, 300]) crystals(pix, rng, x + between(rng, -20, 20), pix.h - 2, 10, FAR_CRYSTAL)
  return pix
}

/** Pared intermedia, más baja y clara, con estalagmitas */
export function midWall(seed: number): Pixmap {
  const rng = makeRng(seed + 3)
  const pix = new Pixmap(380, 80)
  const p = () => rng() * Math.PI * 2
  rockMass(pix, 40, [[2, 14, p()], [4, 7, p()], [7, 3, p()]], MID_ROCK.colors, seed + 4)
  for (let x = 20; x < pix.w; x += between(rng, 50, 90)) spike(pix, x, pix.h - 1, Math.round(between(rng, 14, 26)), Math.round(between(rng, 7, 11)), MID_ROCK, false)
  return pix
}

/** Techo de roca con el borde de abajo ondulado y estalactitas de tamaños variados colgando de él */
export function ceiling(seed: number, width: number, depth: number, spikes: [number, number], rock: Inked = CEILING): Pixmap {
  const rng = makeRng(seed + depth)
  const pix = new Pixmap(width, depth + spikes[1] + 2)
  const waves: [number, number, number][] = [[2, depth * 0.2, rng() * Math.PI * 2], [5, depth * 0.1, rng() * Math.PI * 2]]
  const edge = (x: number) => Math.round(depth * 0.7 + periodicWave(x, width, waves))
  for (let x = 0; x < width; x++) {
    const bottom = edge(x)
    for (let y = 0; y < bottom; y++) {
      const t = 0.75 - (y / bottom) * 0.35 - (bottom - y < 3 ? 0.3 : 0) + (valueNoise(x, y * 2, 14, width, seed) - 0.5) * 0.3
      pix.set(x, y, ramp(rock.colors, t, x, y, 0))
    }
    pix.set(x, bottom, rock.ink)
  }
  for (let x = between(rng, 0, 30); x < width; x += between(rng, 28, 64)) {
    const length = Math.round(between(rng, ...spikes))
    spike(pix, x, edge(Math.round(x)) - 2, length, Math.round(length * between(rng, 0.35, 0.5)), rock, true)
  }
  return pix
}
