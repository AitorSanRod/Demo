// Montañas de Ciudad Plateada: dos cordilleras rocosas sin contorno con picos, la cara que mira a la izquierda (la luz)
// más clara. El cielo y las nubes son los del prado.

import { makeRng, periodicWave, valueNoise } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { ramp } from '../../paint/shade'
import { FAR_MOUNTAINS, MOUNTAINS } from './palette'

type Waves = readonly [cycles: number, amp: number, phase: number][]

/**
 * Cordillera rocosa: picos (la suma de ondas con el valor absoluto de una de ellas) y caras planas a dos tonos según
 * miren al sol o no, con un canto claro arriba y alguna grieta vertical en la cara de sombra.
 */
function rockyRange(pix: Pixmap, base: number, waves: Waves, peaks: Waves, colors: readonly Color[], seed: number) {
  const height = (x: number) => periodicWave(x, pix.w, waves) - Math.abs(periodicWave(x, pix.w, peaks))
  for (let x = 0; x < pix.w; x++) {
    const top = Math.round(pix.h - base - height(x))
    const lit = height(x + 1) - height(x - 1) > 0
    const crack = !lit && valueNoise(x, 0, 6, pix.w, seed) > 0.72
    for (let y = Math.max(0, top); y < pix.h; y++) {
      const depth = y - top
      const fade = (depth / pix.h) * 0.6 + (valueNoise(x, y * 2, 12, pix.w, seed) - 0.5) * 0.2
      const t = (lit ? 0.78 : 0.42) + (depth < 2 ? 0.2 : 0) - fade - (crack && depth > 3 ? 0.25 : 0)
      pix.set(x, y, ramp(colors, t, x, y, 0))
    }
  }
}

export function farMountains(seed: number): Pixmap {
  const rng = makeRng(seed + 2)
  const pix = new Pixmap(360, 56)
  const p = () => rng() * Math.PI * 2
  rockyRange(pix, 30, [[2, 8, p()], [5, 3, p()]], [[3, 9, p()]], FAR_MOUNTAINS, seed)
  return pix
}

export function mountains(seed: number): Pixmap {
  const rng = makeRng(seed + 3)
  const pix = new Pixmap(320, 52)
  const p = () => rng() * Math.PI * 2
  rockyRange(pix, 26, [[2, 7, p()], [4, 3, p()]], [[3, 10, p()], [5, 3, p()]], MOUNTAINS, seed + 5)
  return pix
}

