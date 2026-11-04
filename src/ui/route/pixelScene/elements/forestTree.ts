// Árbol grande del bosque, distinto cada vez: tronco algo torcido e inclinado que se estrecha y abre raíces, y una
// copa como las de los árboles del fondo pero grande: pocas bolas de follaje (centro, dos lóbulos y a veces uno más
// arriba) pintadas como una sola masa, con un par de ramas que asoman por debajo hacia los lóbulos.

import { paintFoliage } from '../paint/foliage'
import { between, valueNoise, type Rng } from '../paint/noise'
import type { Pixmap } from '../paint/pixmap'
import { ramp } from '../paint/shade'
import type { Sphere } from '../paint/spheres'
import { barkTone, treeBase, type TreePalette } from './trees'

/** Variedad del árbol: inclinación de la copa respecto a la base (fracción de `size`) y ancho del tronco en la base */
const TREE = { lean: 0.25, baseWidth: [0.8, 1] } as const
/**
 * Copa en fracción de su tamaño (ver CROWN_PER_TRUNK): altura del centro sobre el tronco, radio de la bola central, de los lóbulos laterales
 * (y cuánto se separan y bajan) y del lóbulo de arriba, que sale con probabilidad `topChance`.
 */
/** Tamaño de la copa respecto al ancho del tronco en la base: troncos más gruesos, copas más grandes */
const CROWN_PER_TRUNK = 1.75
const CROWN = { lift: 0.5, center: 0.85, side: [0.55, 0.7], spread: 0.75, drop: 0.3, top: [0.45, 0.6], topChance: 0.6 } as const

interface Point {
  x: number
  y: number
}

/** Tronco fila a fila siguiendo una línea curva, con raíces abiertas abajo, vetas y contorno */
function trunk(pix: Pixmap, center: (y: number) => number, widthAt: (y: number) => number, top: number, groundY: number, p: TreePalette, seed: number) {
  for (let y = top; y < groundY; y++) {
    const half = widthAt(y) / 2
    const left = Math.round(center(y) - half)
    const right = Math.round(center(y) + half)
    for (let x = left; x < right; x++) {
      const streak = (valueNoise(x * 2, y / 3, 4, pix.w * 2, seed) - 0.5) * 0.35
      pix.set(x, y, ramp(p.trunk.colors, barkTone((x - left + 0.5) / (right - left)) + streak, x, y, 0))
    }
    pix.set(left - 1, y, p.trunk.ink)
    pix.set(right, y, p.trunk.ink)
  }
}

/** Rama que sale de `from` hacia su nube de hojas, curvándose un poco hacia arriba mientras se afina */
function branch(pix: Pixmap, from: Point, angle: number, length: number, width: number, p: TreePalette) {
  let { x, y } = from
  for (let i = 0; i < length; i += 0.5) {
    const k = i / length
    const a = angle + (-Math.PI / 2 - angle) * k * 0.25
    x += Math.cos(a) * 0.5
    y += Math.sin(a) * 0.5
    const w = Math.max(1, width * (1 - k * 0.7))
    for (let o = -w / 2; o < w / 2; o += 0.5) pix.set(x, y + o, o < 0 ? p.trunk.colors[3] : p.trunk.colors[1])
    pix.set(x, y + w / 2, p.trunk.ink)
  }
}

/** Copa de pocas bolas grandes: centro, lóbulo a cada lado algo más bajo y, a veces, otro arriba descentrado */
function crownLobes(rng: Rng, c: Point, size: number): Sphere[] {
  const r = size * CROWN.center
  const lobes: Sphere[] = [{ x: c.x, y: c.y, r, tone: 0 }]
  for (const side of [-1, 1]) {
    const lr = size * between(rng, ...CROWN.side)
    lobes.push({ x: c.x + side * r * CROWN.spread * between(rng, 0.85, 1.15), y: c.y + r * CROWN.drop * between(rng, 0.7, 1.3), r: lr, tone: side < 0 ? -0.05 : -0.2 })
  }
  if (rng() < CROWN.topChance) lobes.push({ x: c.x + between(rng, -0.35, 0.35) * r, y: c.y - r * 0.55, r: size * between(rng, ...CROWN.top), tone: 0.1 })
  return lobes
}

/** Árbol de bosque con la base en (x, groundY); `size` da la anchura de la copa y `height` la altura del tronco */
export function forestTree(pix: Pixmap, rng: Rng, x: number, groundY: number, size: number, height: number, p: TreePalette) {
  const seed = Math.floor(rng() * 1e6)
  const lean = between(rng, -TREE.lean, TREE.lean) * size
  const wobble = rng() * Math.PI * 2
  const base = size * between(rng, ...TREE.baseWidth)
  const top = groundY - height
  const center = (y: number) => {
    const k = (groundY - y) / height
    return x + lean * k * k + Math.sin(k * 4 + wobble) * size * 0.04
  }
  const widthAt = (y: number) => base * (1 - ((groundY - y) / height) * 0.35) + Math.max(0, 5 - (groundY - y)) * base * 0.12
  const crownSize = base * CROWN_PER_TRUNK
  const crown = { x: center(top), y: top - crownSize * CROWN.lift }
  const lobes = crownLobes(rng, crown, crownSize)
  for (const lobe of lobes.slice(1, 3)) {
    const y = groundY - height * between(rng, 0.7, 0.95)
    const from = { x: center(y), y }
    branch(pix, from, Math.atan2(lobe.y - from.y, lobe.x - from.x), Math.hypot(lobe.x - from.x, lobe.y - from.y) * 0.7, base * between(rng, 0.25, 0.4), p)
  }
  trunk(pix, center, widthAt, top, groundY, p, seed)
  paintFoliage(pix, lobes, p.leaves.colors, { seed: Math.floor(rng() * 1e6), ink: p.leaves.ink, jitter: 0.8, texture: 0.15, gaps: false })
  treeBase(pix, rng, x, groundY, base, p)
}
