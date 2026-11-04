// Nubes tipo cúmulo: muchas bolas sobre una base plana, más altas en el centro, con el borde algodonoso.
// Sin contorno oscuro: la sombra de abajo es lila clara, como en las referencias.

import { paintFoliage } from '../paint/foliage'
import { between, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'
import type { Sphere } from '../paint/spheres'

export interface CloudShape {
  /** Centro horizontal y línea de la base, en píxeles de arte */
  x: number
  baseY: number
  width: number
  height: number
}

/** `colors`: 4 tonos de nube, de la sombra de la base al blanco */
export function cumulus(pix: Pixmap, rng: Rng, shape: CloudShape, colors: readonly Color[]) {
  const { x, baseY, width, height } = shape
  const spheres: Sphere[] = []
  const count = Math.max(3, Math.round(width / 6))
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const bell = Math.sin(Math.PI * t)
    const r = (3 + bell * height * 0.45) * between(rng, 0.75, 1.2)
    spheres.push({ x: x - width / 2 + t * width, y: baseY - r * 0.5 - bell * height * 0.25, r, z: bell * 4, tone: between(rng, -0.2, 0.3) })
  }
  for (let i = 0; i < Math.round(width / 20) + 1; i++) {
    const r = height * between(rng, 0.25, 0.38)
    spheres.push({ x: x + between(rng, -width / 3, width / 3), y: baseY - height * between(rng, 0.55, 0.75), r, z: 3, tone: 0.3 })
  }
  const shades = [colors[0], ...colors]
  paintFoliage(pix, spheres, shades, { seed: Math.floor(rng() * 1e6), ink: colors[0], floorY: baseY, jitter: 1, texture: 0.12 })
}
