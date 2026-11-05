// Fondo de Ciudad Plateada al atardecer: cielo de violeta a naranja, sol bajo detrás de las montañas, nubes
// alargadas y dos cordilleras rocosas sin contorno (la cara que mira a la izquierda, al sol, más clara).

import { cumulus } from '../../elements/clouds'
import { between, makeRng, periodicWave, valueNoise } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { ramp, verticalGradient } from '../../paint/shade'
import { CLOUD, FAR_MOUNTAINS, MOUNTAINS, SKY, SUN } from './palette'

/** Altura sobre el borde inferior donde el cielo llega a su tono más cálido (detrás de las montañas) */
const HORIZON = 130
/** Sol: radio del disco y del halo, en píxeles de arte, y ancho de la tesela (un sol por pantalla ancha) */
const SUN_SIZE = { radius: 13, glow: 19, tile: 420 }

type Waves = readonly [cycles: number, amp: number, phase: number][]

export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, SKY, 0, Math.max(2, height - HORIZON), 0)
  pix.rect(0, height - HORIZON, 16, HORIZON, SKY[SKY.length - 1])
  return pix
}

/** Sol grande y bajo con un halo suave; la cordillera le tapa la parte de abajo */
export function sun(): Pixmap {
  const pix = new Pixmap(SUN_SIZE.tile, SUN_SIZE.glow * 2 + 1)
  const cx = 70
  const cy = SUN_SIZE.glow
  for (let y = 0; y < pix.h; y++)
    for (let x = cx - SUN_SIZE.glow; x <= cx + SUN_SIZE.glow; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= SUN_SIZE.radius - 2) pix.set(x, y, SUN.core)
      else if (d <= SUN_SIZE.radius) pix.set(x, y, SUN.rim)
      else if (d <= SUN_SIZE.glow) pix.set(x, y, SUN.glow)
    }
  return pix
}

/** Nubes bajas y alargadas teñidas por el atardecer */
export function clouds(seed: number): Pixmap {
  const rng = makeRng(seed)
  const pix = new Pixmap(380, 50)
  cumulus(pix, rng, { x: 120, baseY: 46, width: 120, height: 18 }, CLOUD)
  cumulus(pix, rng, { x: 300, baseY: 30, width: 60, height: 9 }, CLOUD)
  return pix
}

/** Nubecillas sueltas en lo alto */
export function wisps(seed: number): Pixmap {
  const rng = makeRng(seed + 1)
  const pix = new Pixmap(300, 40)
  for (let i = 0; i < 3; i++) cumulus(pix, rng, { x: i * 100 + between(rng, 0, 50), baseY: Math.round(between(rng, 10, 36)), width: between(rng, 14, 26), height: between(rng, 3, 5) }, CLOUD)
  return pix
}

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

