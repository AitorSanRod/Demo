// Matas de hojas que salen de un punto del suelo y se mecen: helechos puntiagudos (primer plano)
// u hojas anchas y redondeadas (plantas al borde del camino).

import { between, type Rng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'

interface Leaf {
  angle: number
  length: number
  width: number
  bend: number
}

export interface LeafClump {
  x: number
  leaves: Leaf[]
  /** Hoja redondeada (ancha hasta cerca de la punta) en vez de puntiaguda */
  round: boolean
}

/** Forma de las hojas de una mata; los rangos son [mín, máx] y las medidas, fracciones del tamaño de la mata */
export interface LeafStyle {
  count: [number, number]
  length: [number, number]
  width: [number, number]
  bend: [number, number]
  round: boolean
}

export const FERN_LEAVES: LeafStyle = { count: [6, 10], length: [0.6, 1], width: [0.09, 0.14], bend: [0.25, 0.6], round: false }
export const BROAD_LEAVES: LeafStyle = { count: [5, 8], length: [0.55, 0.9], width: [0.17, 0.24], bend: [0.2, 0.45], round: true }

export function makeClump(rng: Rng, x: number, size: number, style: LeafStyle = FERN_LEAVES): LeafClump {
  const count = Math.round(between(rng, ...style.count))
  const leaves = Array.from({ length: count }, (_, i) => ({
    angle: -Math.PI * (0.1 + (0.8 * (i + rng() * 0.6)) / count),
    length: size * between(rng, ...style.length),
    width: size * between(rng, ...style.width),
    bend: between(rng, ...style.bend) * (i < count / 2 ? -1 : 1),
  }))
  // Las hojas más tumbadas van detrás y las más verticales delante, para que la mata se vea redonda
  leaves.sort((a, b) => Math.abs(b.angle + Math.PI / 2) - Math.abs(a.angle + Math.PI / 2))
  return { x, leaves, round: style.round }
}

/** Media anchura de la hoja a lo largo de su nervio (`s` de 0 en la base a 1 en la punta) */
function profile(s: number, round: boolean): number {
  return round ? Math.sin(Math.PI * s) ** 0.5 : Math.sin(Math.PI * Math.min(1, s * 1.15))
}

/**
 * Avanza por el nervio central y pinta a cada lado; la mitad de arriba es más clara.
 * `colors`: borde, sombra, cara iluminada y nervio. El borde oscuro solo va en el lado de sombra: en el lado
 * iluminado la hoja se funde con lo de detrás, como en las referencias.
 */
function paintLeaf(pix: Pixmap, baseX: number, baseY: number, leaf: Leaf, round: boolean, sway: number, colors: readonly Color[]) {
  const steps = leaf.length * 2
  let x = baseX
  let y = baseY
  for (let i = 0; i < steps; i++) {
    const s = i / steps
    const angle = leaf.angle + (leaf.bend + sway) * s
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    x += dirX * 0.5
    y += dirY * 0.5
    const half = profile(s, round) * leaf.width
    for (let o = -half; o <= half; o += 0.5) {
      const shadowEdge = o > half - 1
      const color = shadowEdge ? colors[0] : Math.abs(o) < 0.6 ? colors[3] : o < 0 ? colors[2] : colors[1]
      pix.set(x - dirY * o, y + dirX * o, color)
    }
  }
}

export function leafFrames(width: number, height: number, clumps: readonly LeafClump[], colors: readonly Color[], frames: number, sway = 0.08): Pixmap[] {
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(width, height)
    const phase = (2 * Math.PI * f) / frames
    for (const clump of clumps)
      clump.leaves.forEach((leaf, i) => paintLeaf(pix, clump.x, height + 2, leaf, clump.round, Math.sin(phase + i * 0.7) * sway, colors))
    return pix
  })
}
