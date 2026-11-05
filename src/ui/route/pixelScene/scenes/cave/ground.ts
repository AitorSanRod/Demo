// Suelo de la cueva: roca plana a manchas suaves, con grietas cortas, piedrecitas y de tarde en tarde un charco
// que refleja el brillo de los cristales. Arriba y abajo, un reborde de roca más oscura con el borde irregular.

import { between, hash, makeRng, valueNoise } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ramp } from '../../paint/shade'
import { PATH } from '../meadow/ground'
import { FLOOR, FLOOR_INK, NEAR_ROCK, PUDDLE } from './palette'

/** Tesela del suelo: ancha para que charcos y grietas no se repitan a la vista */
const FLOOR_WIDTH = 900
/** Charcos por tesela y su tamaño (semiancho y semialto), en píxeles de arte */
const PUDDLES = { count: 2, size: [16, 4] as const }
const CRACKS = 14
const PEBBLES = 50

/** Reborde de roca del borde del camino: más alto o más bajo en cada columna, sin línea recta */
const ledge = (x: number, seed: number, base: number) => base + Math.round(valueNoise(x, 0, 8, FLOOR_WIDTH, seed) * 4)

function puddle(pix: Pixmap, cx: number, cy: number) {
  const [w, h] = PUDDLES.size
  for (let y = -h; y <= h; y++)
    for (let x = -w; x <= w; x++) {
      if ((x / w) ** 2 + (y / h) ** 2 > 1) continue
      pix.set(cx + x, cy + y, y === -h || (y < 0 && Math.abs(x) > w * 0.8) ? FLOOR_INK : x < -w * 0.4 && y === 0 ? PUDDLE[2] : y < 0 ? PUDDLE[1] : PUDDLE[0])
    }
}

export function cavePath(seed: number): Pixmap {
  const rng = makeRng(seed + 7)
  const pix = new Pixmap(FLOOR_WIDTH, PATH.height)
  for (let x = 0; x < pix.w; x++) {
    const top = ledge(x, seed, PATH.dirtTop - 4)
    const bottom = ledge(x, seed + 1, PATH.dirtBottom - 2)
    for (let y = 0; y < pix.h; y++) {
      const rim = y < top || y > bottom
      const patch = valueNoise(x, y * 3, 28, pix.w, seed) + (hash(x, y, seed) - 0.5) * 0.06
      const shadow = y - top < 3 ? 0.35 : 0
      pix.set(x, y, rim ? ramp(NEAR_ROCK.colors, 0.3 + patch * 0.3 - (y < top ? 0.15 : 0), x, y, 0) : ramp(FLOOR, 0.35 + patch * 0.4 - shadow, x, y, 0))
    }
    pix.set(x, top, NEAR_ROCK.ink)
    pix.set(x, bottom, NEAR_ROCK.colors[3])
  }
  for (let i = 0; i < PUDDLES.count; i++) puddle(pix, Math.round((i + between(rng, 0.2, 0.8)) * (pix.w / PUDDLES.count)), Math.round(between(rng, 26, 46)))
  for (let i = 0; i < CRACKS; i++) {
    let x = Math.round(rng() * pix.w)
    let y = Math.round(between(rng, PATH.dirtTop + 6, PATH.dirtBottom - 6))
    for (let k = 0; k < 6; k++, x += 1, y += rng() < 0.5 ? 0 : rng() < 0.5 ? 1 : -1) pix.set(x, y, FLOOR_INK)
  }
  for (let i = 0; i < PEBBLES; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(between(rng, PATH.dirtTop + 4, PATH.dirtBottom - 4))
    pix.rect(x, y, 2, 1, FLOOR[3])
    pix.rect(x, y + 1, 2, 1, FLOOR_INK)
  }
  return pix
}
