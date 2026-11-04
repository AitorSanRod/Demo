// Follaje: racimos de hojas hechos de esferas con el borde mordido (hojas sueltas), luz de arriba a la izquierda,
// manchas de hojas dentro de cada tono, huecos oscuros entre racimos y contorno solo en el lado de sombra.

import { hash, valueNoise } from './noise'
import type { Color, Pixmap } from './pixmap'
import { ramp } from './shade'
import type { Sphere } from './spheres'

export interface FoliageOptions {
  seed: number
  /** Contorno de la parte de abajo (solo bajo bordes llenos, para no dejar motas sueltas) */
  ink: Color
  /** Corta por debajo de esta Y (base plana de arbustos apoyados en el suelo) */
  floorY?: number
  /** Cuánto muerde el borde, en píxeles de arte */
  jitter?: number
  /** Fuerza de las manchas de hojas dentro de cada tono (0–1) */
  texture?: number
  /** Huecos oscuros donde un racimo tapa a otro (desactivar para copas lisas) */
  gaps?: boolean
}

/** Diferencia de profundidad, en píxeles, a partir de la cual el racimo de detrás se ve como hueco oscuro */
const GAP_DEPTH = 2
/** Tamaño de las hojas sueltas del borde, en píxeles de arte */
const LEAF = 2

const LIGHT = (() => {
  const [x, y, z] = [-0.6, -0.75, 0.4]
  const len = Math.hypot(x, y, z)
  return [x / len, y / len, z / len]
})()

interface Hit {
  s: Sphere
  depth: number
  nz: number
}

/** `colors`: hueco, sombra, base, luz y brillo (5 tonos de oscuro a claro) */
export function paintFoliage(pix: Pixmap, spheres: readonly Sphere[], colors: readonly Color[], opts: FoliageOptions) {
  const { seed, ink, floorY = Infinity, jitter = 1.6, texture = 0.4, gaps = true } = opts
  const wrap = (x: number) => ((x % pix.w) + pix.w) % pix.w
  const minX = Math.floor(Math.min(...spheres.map((s) => s.x - s.r))) - 3
  const maxX = Math.ceil(Math.max(...spheres.map((s) => s.x + s.r))) + 3
  const minY = Math.floor(Math.min(...spheres.map((s) => s.y - s.r))) - 3
  const maxY = Math.min(Math.ceil(Math.max(...spheres.map((s) => s.y + s.r))) + 3, floorY)
  const w = maxX - minX
  const hits: (Hit | undefined)[] = []
  for (let y = minY; y < maxY; y++)
    for (let x = minX; x < maxX; x++) {
      const bite = (hash(Math.floor(wrap(x) / LEAF), Math.floor(y / LEAF), seed) - 0.5) * 2 * jitter
      let best: Hit | undefined
      for (const s of spheres) {
        const d = Math.hypot(x + 0.5 - s.x, y + 0.5 - s.y)
        if (d > s.r + bite) continue
        const nz = Math.sqrt(Math.max(0, 1 - (d / s.r) ** 2))
        const depth = (s.z ?? 0) + nz * s.r
        if (!best || depth > best.depth) best = { s, depth, nz }
      }
      hits.push(best)
    }
  const at = (x: number, y: number) => (x < minX || x >= maxX || y < minY || y >= maxY ? undefined : hits[(y - minY) * w + (x - minX)])

  for (let y = minY; y < maxY; y++)
    for (let x = minX; x < maxX; x++) {
      const hit = at(x, y)
      if (!hit) {
        if (at(x, y - 1) && at(x - 1, y - 1) && at(x + 1, y - 1)) pix.set(x, y, ink)
        continue
      }
      const above = at(x, y - 1) ?? at(x, y - 2)
      if (gaps && above && above.s !== hit.s && above.depth - hit.depth > GAP_DEPTH) {
        pix.set(x, y, colors[0])
        continue
      }
      const nx = (x + 0.5 - hit.s.x) / hit.s.r
      const ny = (y + 0.5 - hit.s.y) / hit.s.r
      const lit = nx * LIGHT[0] + ny * LIGHT[1] + hit.nz * LIGHT[2]
      const leaves = (valueNoise(wrap(x), y, 2.5, pix.w, seed) - 0.5) * texture
      let t = 0.32 + 0.62 * lit + (hit.s.tone ?? 0) * 0.15 + leaves
      if (Number.isFinite(floorY)) t -= 0.35 * Math.max(0, 1 - (floorY - y) / 5)
      pix.set(x, y, ramp(colors, t, x, y, 0))
    }
}
