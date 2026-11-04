// Árboles de copa frondosa: tronco con vetas (claro a la izquierda, sombra a la derecha), ramas que asoman bajo la
// copa y racimos de hojas con el borde mordido.

import { paintFoliage } from '../paint/foliage'
import { between, valueNoise, type Rng } from '../paint/noise'
import { TRANSPARENT, type Color, type Pixmap } from '../paint/pixmap'
import { ramp } from '../paint/shade'
import type { Sphere } from '../paint/spheres'

export interface Inked {
  colors: readonly Color[]
  ink: Color
}

/** `leaves.colors`: hueco, sombra, base, luz y brillo. `trunk.colors`: oscuro, sombra, base, luz y brillo */
export interface TreePalette {
  leaves: Inked
  trunk: Inked
}

/** Tono del tronco en una columna: `u` va de 0 (borde izquierdo, iluminado) a 1 (borde derecho) */
export const barkTone = (u: number) => 0.92 - u * 0.85

/** Tronco que se estrecha hacia arriba, con raíces abiertas, vetas verticales y contorno */
function trunk(pix: Pixmap, cx: number, groundY: number, width: number, height: number, wood: Inked, seed: number) {
  for (let y = groundY - height; y < groundY; y++) {
    const up = (groundY - y) / height
    const roots = Math.max(0, 4 - (groundY - y)) * (width / 6)
    const half = (width * (1 - up * 0.3)) / 2 + roots
    const left = Math.round(cx - half)
    const right = Math.round(cx + half)
    for (let x = left; x < right; x++) {
      const u = (x - left + 0.5) / (right - left)
      const streak = (valueNoise(x * 2, y / 3, 4, pix.w * 2, seed) - 0.5) * 0.35
      pix.set(x, y, ramp(wood.colors, barkTone(u) + streak, x, y, 0))
    }
    pix.set(left - 1, y, wood.ink)
    pix.set(right, y, wood.ink)
  }
}

/**
 * Pie del árbol para que no acabe cortado en seco: sombra suave en el suelo (solo donde ya hay suelo pintado),
 * raíces que se abren y se hunden y briznas de hierba que tapan la base del tronco.
 */
export function treeBase(pix: Pixmap, rng: Rng, cx: number, groundY: number, width: number, palette: TreePalette) {
  const [, shade, base, light] = palette.leaves.colors
  const reach = width * 1.6
  for (let x = Math.round(cx - reach); x <= cx + reach; x++)
    for (const dy of [0, 1]) {
      const inside = Math.abs(x - cx) < reach * (dy === 0 ? 1 : 0.7)
      if (inside && pix.get(x, groundY + dy) !== TRANSPARENT) pix.set(x, groundY + dy, shade)
    }
  for (const side of [-1, 1]) {
    const length = width * between(rng, 0.5, 0.8)
    for (let i = 0; i < length; i++) {
      const x = Math.round(cx + side * (width / 2 + i))
      const y = Math.round(groundY - 2 + (i / length) * 2.5)
      pix.set(x, y, palette.trunk.colors[side < 0 ? 3 : 1])
      pix.set(x, y + 1, palette.trunk.ink)
    }
  }
  for (let x = Math.round(cx - width); x <= cx + width; x++) {
    const blade = Math.floor(rng() * 4)
    for (let k = 0; k < blade; k++) pix.set(x, groundY - k, k === blade - 1 ? light : k === 0 ? shade : base)
  }
}

/** Rama recta que se afina, del punto (x, y) en la dirección `angle` */
function branch(pix: Pixmap, x: number, y: number, angle: number, length: number, width: number, wood: Inked) {
  for (let i = 0; i < length; i += 0.5) {
    const w = width * (1 - i / length) + 1
    const px = x + Math.cos(angle) * i
    const py = y + Math.sin(angle) * i
    for (let o = -w / 2; o < w / 2; o += 0.5) pix.set(px, py + o, o < 0 ? wood.colors[3] : wood.colors[1])
    pix.set(px, py + w / 2, wood.ink)
  }
}

/** Árbol redondo junto al camino: `size` es la mitad del ancho de la copa; el tronco mide `trunkHeight` */
export function broadTree(pix: Pixmap, rng: Rng, cx: number, groundY: number, size: number, trunkHeight: number, palette: TreePalette) {
  const seed = Math.floor(rng() * 1e6)
  const width = Math.max(4, Math.round(size * 0.42))
  const top = groundY - trunkHeight
  trunk(pix, cx, groundY, width, trunkHeight + Math.round(size * 0.3), palette.trunk, seed)
  for (const side of [-1, 1]) branch(pix, cx, top + size * 0.25, -Math.PI / 2 + side * between(rng, 0.7, 1), size * 0.95, width * 0.5, palette.trunk)
  const spheres = domeCanopy(rng, cx, top - size * 0.45, size)
  paintFoliage(pix, spheres, palette.leaves.colors, { seed, ink: palette.leaves.ink, jitter: 0.6, texture: 0.12, gaps: false })
  treeBase(pix, rng, cx, groundY, width, palette)
}

/**
 * Bultos de la copa redonda: uno por cada `perSize` píxeles de tamaño (mínimo `min`), de radio `radius` (fracción de
 * la copa, con variación) y a `reach` del centro. Recorren todo el contorno salvo el hueco del tronco (`trunkGap` rad).
 */
const DOME_BUMPS = { min: 7, perSize: 3.5, radius: [0.28, 0.46], reach: 0.74, trunkGap: 0.45 } as const

/**
 * Copa redonda al estilo de las referencias, pero con silueta orgánica: una bola central y muchos bultos de tamaños
 * variados por todo el borde (arriba, lados y abajo), algo adelantados para que cada uno tenga su brillo y su sombra.
 * Sin huecos oscuros por dentro.
 */
function domeCanopy(rng: Rng, cx: number, cy: number, size: number): Sphere[] {
  const ry = size * 0.82
  const spheres: Sphere[] = [{ x: cx, y: cy, r: size * 0.72, tone: -0.1 }]
  const count = Math.max(DOME_BUMPS.min, Math.round(size / DOME_BUMPS.perSize))
  const arc = Math.PI * 2 - DOME_BUMPS.trunkGap
  for (let i = 0; i < count; i++) {
    const angle = Math.PI / 2 + DOME_BUMPS.trunkGap / 2 + (arc * (i + between(rng, 0.2, 0.8))) / count
    const reach = DOME_BUMPS.reach * between(rng, 0.85, 1.1)
    const below = Math.sin(angle) > 0.3
    spheres.push({
      x: cx + Math.cos(angle) * size * reach,
      y: cy + Math.sin(angle) * ry * reach,
      r: size * between(rng, ...DOME_BUMPS.radius),
      z: -size * between(rng, 0.05, 0.15),
      tone: below ? between(rng, -0.35, -0.15) : between(rng, -0.05, 0.2),
    })
  }
  return spheres
}
