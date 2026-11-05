// Seto de arbustos, rocas con musgo y pinos de fondo.

import { paintFoliage } from '../paint/foliage'
import { between, hash, type Rng } from '../paint/noise'
import { Pixmap, TRANSPARENT, type Color } from '../paint/pixmap'
import { paintSpheres, type Sphere } from '../paint/spheres'
import type { Inked } from './trees'

/** Arbusto apoyado en el suelo: varios racimos, más alto en el centro */
export function bush(pix: Pixmap, rng: Rng, cx: number, groundY: number, width: number, height: number, leaves: Inked) {
  const count = Math.max(2, Math.round(width / 7))
  const spheres: Sphere[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const bell = Math.sin(Math.PI * (0.15 + t * 0.7))
    const r = between(rng, 0.45, 0.6) * height * (0.7 + bell * 0.3)
    spheres.push({ x: cx - width / 2 + t * width, y: groundY - height * bell + r * 0.9, r, z: bell * 4, tone: between(rng, -0.2, 0.2) })
  }
  paintFoliage(pix, spheres, leaves.colors, { seed: Math.floor(rng() * 1e6), ink: leaves.ink, floorY: groundY, jitter: 0.8, texture: 0.15, gaps: false })
}

/** Fila de arbustos de alturas variadas que cubre `width` píxeles desde `x` */
export function hedge(pix: Pixmap, rng: Rng, x: number, width: number, groundY: number, heights: [number, number], leaves: Inked) {
  let cx = x
  while (cx < x + width) {
    const w = between(rng, 18, 34)
    bush(pix, rng, cx + w / 2, groundY, w, between(rng, ...heights), leaves)
    cx += w * between(rng, 0.6, 0.85)
  }
}

/** Roca redondeada con un casquete de musgo de borde irregular */
export function mossyRock(pix: Pixmap, rng: Rng, cx: number, groundY: number, size: number, stone: Inked, moss: readonly Color[]) {
  const w = Math.ceil(size * 2.6)
  const h = Math.ceil(size * 1.4)
  const local = new Pixmap(w, h + 1, false)
  const spheres: Sphere[] = [
    { x: w * 0.45, y: h - size * 0.35, r: size * 0.8, z: 1 },
    { x: w * 0.25, y: h - size * 0.1, r: size * 0.55, tone: -0.1 },
    { x: w * 0.72, y: h, r: size * 0.6, tone: -0.2 },
  ]
  paintSpheres(local, spheres, stone.colors, { floorY: h, floorShade: 0.3, outline: stone.ink, lines: stone.ink })
  const seed = Math.floor(rng() * 1e6)
  for (let x = 0; x < w; x++) {
    let top = 0
    while (top < h && local.get(x, top) === TRANSPARENT) top++
    const depth = 2 + Math.floor(hash(x >> 1, 0, seed) * 3) + (x < w * 0.6 ? 1 : 0)
    for (let y = top; y < Math.min(h, top + depth); y++) local.set(x, y, y === top ? moss[2] : y === top + depth - 1 ? moss[0] : moss[1])
  }
  pix.stamp(local, Math.round(cx - w / 2), groundY - h)
}

/** Pino de fondo en pisos de dientes de sierra; la mitad izquierda va más clara. `colors`: 5 tonos */
export function pine(pix: Pixmap, rng: Rng, cx: number, groundY: number, height: number, colors: readonly Color[]) {
  const seed = Math.floor(rng() * 1e6)
  const half = height * 0.32
  const tiers = Math.max(3, Math.round(height / 9))
  const top = groundY - height
  pix.rect(Math.round(cx) - 1, groundY - 3, 2, 3, colors[0])
  for (let y = top; y < groundY - 2; y++) {
    const along = (y - top) / (groundY - 2 - top)
    const inTier = (along * tiers) % 1
    const width = half * (0.15 + along * 0.85) * (0.55 + inTier * 0.45)
    for (let x = Math.round(cx - width); x <= cx + width; x++) {
      const u = (x - cx) / Math.max(1, width)
      const edge = Math.abs(u) > 0.8 && hash(x, y, seed) < 0.35
      if (edge) continue
      const tone = inTier > 0.85 ? 0 : u < -0.35 ? 3 : u < 0.2 ? 2 : 1
      pix.set(x, y, colors[tone + (tone === 3 && inTier < 0.3 ? 1 : 0)])
    }
  }
}

/** Esquina redondeada del seto recortado: píxeles que se quitan en cada fila desde arriba */
const HEDGE_CORNER = [3, 1, 1]

/**
 * Seto recortado de jardín de ciudad: un bloque con las esquinas de arriba redondeadas, la cara de arriba y el lado
 * izquierdo iluminados, el derecho y el pie en sombra, contorno abajo y a la derecha y manchas de hojas sueltas.
 * `leaves.colors`: hueco, sombra, base, luz y brillo.
 */
export function trimmedHedge(pix: Pixmap, rng: Rng, x: number, width: number, groundY: number, height: number, leaves: Inked) {
  const [hole, shade, base, light, shine] = leaves.colors
  const seed = Math.floor(rng() * 1e6)
  const top = groundY - height
  for (let y = top; y < groundY; y++) {
    const cut = HEDGE_CORNER[y - top] ?? 0
    const right = x + width - cut - 1
    for (let px = x + cut; px <= right; px++) {
      const fromTop = y - top
      const tone = fromTop < 2 ? shine : fromTop < 4 ? light : px > right - 3 || y > groundY - 3 ? shade : px < x + cut + 2 ? light : base
      const fleck = hash(px >> 1, y >> 1, seed) < 0.12 && fromTop > 2
      pix.set(px, y, fleck ? (tone === base || tone === light ? shade : hole) : tone)
    }
    pix.set(right, y, leaves.ink)
  }
  pix.rect(x, groundY - 1, width, 1, leaves.ink)
}
