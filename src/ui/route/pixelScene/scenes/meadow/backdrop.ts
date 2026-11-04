// Fondo del prado: cielo, nubes sobre las colinas y colinas azuladas y verdes (la llanura está en plain.ts).

import { cumulus } from '../../elements/clouds'
import { between, makeRng, periodicWave, periodicWaveSlope, valueNoise } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { ramp, verticalGradient } from '../../paint/shade'
import { CLOUD, FAR_HILLS, HILLS, SKY } from './palette'

/** Altura sobre el borde inferior donde el cielo llega a su tono más claro (detrás de las colinas) */
const HORIZON = 150

type Waves = readonly [cycles: number, amp: number, phase: number][]

export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, SKY, 0, Math.max(2, height - HORIZON), 0)
  pix.rect(0, height - HORIZON, 16, HORIZON, SKY[SKY.length - 1])
  return pix
}

/** Una nube grande apoyada sobre las colinas y otra pequeña, por tesela */
export function clouds(seed: number): Pixmap {
  const rng = makeRng(seed)
  const pix = new Pixmap(360, 56)
  cumulus(pix, rng, { x: 90, baseY: 54, width: 130, height: 40 }, CLOUD)
  cumulus(pix, rng, { x: 280, baseY: 46, width: 44, height: 12 }, CLOUD)
  return pix
}

/** Nubecillas sueltas en lo alto del cielo */
export function wisps(seed: number): Pixmap {
  const rng = makeRng(seed + 1)
  const pix = new Pixmap(300, 40)
  for (let i = 0; i < 4; i++) cumulus(pix, rng, { x: i * 75 + between(rng, 0, 40), baseY: Math.round(between(rng, 8, 38)), width: between(rng, 8, 18), height: between(rng, 3, 5) }, CLOUD)
  return pix
}

/** Colinas redondeadas sin contorno: más claras en la ladera que mira a la izquierda (la luz) y en lo alto */
function hillRange(pix: Pixmap, base: number, waves: Waves, colors: readonly Color[], seed: number) {
  for (let x = 0; x < pix.w; x++) {
    const top = Math.round(pix.h - base - periodicWave(x, pix.w, waves))
    const slope = periodicWaveSlope(x, pix.w, waves)
    for (let y = top; y < pix.h; y++) {
      const depth = y - top
      const patches = (valueNoise(x, y * 2, 10, pix.w, seed) - 0.5) * 0.3
      const t = 0.55 + slope * 0.9 + (depth < 3 ? 0.2 : 0) - (depth / pix.h) * 0.5 + patches
      pix.set(x, y, ramp(colors, t, x, y, 0))
    }
  }
}

export function farHills(seed: number): Pixmap {
  const rng = makeRng(seed + 2)
  const pix = new Pixmap(320, 48)
  const p = () => rng() * Math.PI * 2
  hillRange(pix, 30, [[2, 7, p()], [3, 4, p()]], FAR_HILLS, seed)
  return pix
}

export function hills(seed: number): Pixmap {
  const rng = makeRng(seed + 3)
  const pix = new Pixmap(288, 44)
  const p = () => rng() * Math.PI * 2
  hillRange(pix, 22, [[2, 6, p()], [4, 3, p()]], HILLS, seed + 5)
  return pix
}
