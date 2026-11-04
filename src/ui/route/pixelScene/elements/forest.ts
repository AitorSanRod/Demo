// Piezas del bosque: árboles de fondo (tronco recto con su copa), la banda de copas que cuelga del borde de arriba
// con algún claro y los rayos de luz que entran por los claros.

import { paintFoliage } from '../paint/foliage'
import { between, type Rng } from '../paint/noise'
import { rgba, type Color, type Pixmap } from '../paint/pixmap'
import type { Sphere } from '../paint/spheres'
import type { Inked } from './trees'

/** Tramo de la tesela donde las copas se abren y entra la luz, en píxeles de arte */
export interface Clearing {
  from: number
  to: number
}

/** Distancia, en píxeles de arte, en la que las copas se van abriendo al acercarse a un claro */
const CLEARING_FADE = 50

/** Cuánto se abren las copas en `x`: 0 lejos de los claros, 1 dentro, y una transición suave entre medias */
function openness(x: number, clearings: readonly Clearing[]): number {
  const k = Math.max(0, ...clearings.map((c) => 1 - Math.max(0, c.from - x, x - c.to) / CLEARING_FADE))
  return k * k * (3 - 2 * k)
}

const lerp = (closed: number, open: number, t: number) => closed + (open - closed) * t

/** Árbol de fondo: tronco recto a tres tonos (claro a la izquierda) y copa redonda arriba, sin detalle */
export function distantTree(pix: Pixmap, rng: Rng, x: number, groundY: number, width: number, crownY: number, trunk: readonly Color[], leaves: Inked) {
  for (let y = crownY; y < groundY; y++) {
    const half = width / 2 + (y > groundY - 3 ? groundY - y : 0)
    for (let px = Math.round(x - half); px < x + half; px++) {
      const u = (px - (x - half)) / (half * 2)
      pix.set(px, y, trunk[u < 0.3 ? 2 : u < 0.75 ? 1 : 0])
    }
  }
  const r = width * between(rng, 2.2, 3.2)
  const crown: Sphere[] = [
    { x, y: crownY, r },
    { x: x - r * 0.7, y: crownY + r * 0.25, r: r * 0.7, tone: -0.1 },
    { x: x + r * 0.7, y: crownY + r * 0.3, r: r * 0.65, tone: -0.2 },
  ]
  paintFoliage(pix, crown, leaves.colors, { seed: Math.floor(rng() * 1e6), ink: leaves.ink, jitter: 0.8, texture: 0.15, gaps: false })
}

/**
 * Banda de copas que cuelga del borde de arriba, solo de follaje: una fila de bolas pegada al borde (nunca se ve el
 * cielo por arriba) y otra más grande y más baja que da el contorno ondulado. Al acercarse a un claro las bolas se
 * hacen más pequeñas y suben poco a poco, así la luz entra sin cortes.
 */
export function canopyBand(pix: Pixmap, rng: Rng, depth: number, clearings: readonly Clearing[], leaves: Inked) {
  const spheres: Sphere[] = []
  for (let x = -10; x < pix.w + 10; x += lerp(16, 10, openness(x, clearings))) {
    const t = openness(x, clearings)
    spheres.push({ x, y: lerp(depth * 0.12, -3, t) + between(rng, -2, 2), r: lerp(18, 7, t) * between(rng, 0.9, 1.1), z: 0, tone: between(rng, -0.1, 0.15) })
  }
  for (let x = 0; x < pix.w; x += between(rng, 18, 28)) {
    const t = openness(x, clearings)
    if (t > 0.85) continue
    const r = lerp(between(rng, 16, 24), 7, t)
    spheres.push({ x, y: lerp(between(rng, depth * 0.35, depth * 0.6), 0, t), r, z: between(rng, 2, 8), tone: between(rng, -0.25, 0.15) })
  }
  paintFoliage(pix, spheres, leaves.colors, { seed: Math.floor(rng() * 1e6), ink: leaves.ink, jitter: 1.2, texture: 0.18, gaps: false })
}

/** Pasos de transparencia de los rayos (pocos, para que el desvanecido vaya a bandas como el resto del pixel art) */
const RAY_STEPS = 8

/**
 * Rayos de luz que bajan en diagonal desde los claros, semitransparentes: más tenues en los bordes y desvaneciéndose
 * a lo largo de su recorrido hasta desaparecer. `alpha` es la opacidad del centro del rayo arriba del todo.
 */
export function lightRays(pix: Pixmap, rng: Rng, clearings: readonly Clearing[], color: string, alpha: number) {
  for (const c of clearings) {
    const rays = Math.round(between(rng, 2, 4))
    for (let i = 0; i < rays; i++) {
      const start = c.from + ((i + 0.5) / rays) * (c.to - c.from)
      const width = between(rng, 4, 9)
      const slant = between(rng, 0.25, 0.4)
      const length = pix.h * between(rng, 0.7, 1)
      for (let y = 0; y < length; y++) {
        const fade = Math.floor((1 - y / length) ** 1.3 * RAY_STEPS) / RAY_STEPS
        if (fade <= 0) break
        const left = start + y * slant
        for (let x = Math.round(left); x < left + width; x++) {
          const edge = x < left + 1 || x >= left + width - 1
          pix.set(x, y, rgba(color, alpha * fade * (edge ? 0.5 : 1)))
        }
      }
    }
  }
}
