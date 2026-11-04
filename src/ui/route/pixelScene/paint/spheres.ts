// Volúmenes hechos de esferas (copas de árbol, arbustos, nubes, rocas) iluminados desde arriba a la izquierda,
// con contorno exterior y líneas donde un racimo tapa a otro, al estilo de los juegos de Pokémon de GBA.

import type { Color, Pixmap } from './pixmap'
import { ramp } from './shade'

export interface Sphere {
  x: number
  y: number
  r: number
  /** Profundidad extra: la esfera con más relieve en un píxel es la que se ve */
  z?: number
  /** Desplaza la luz de esta esfera (−1 a 1) para que no todas las bolas sean iguales */
  tone?: number
}

export interface SphereOptions {
  /** Corta todo lo que quede por debajo de esta Y (base plana de las nubes) */
  floorY?: number
  /** Oscurece las filas cercanas a `floorY` (sombra de la base) */
  floorShade?: number
  /** Anchura de la franja tramada (ver DITHER en shade.ts); por defecto bandas limpias */
  dither?: number
  /** Peso de la luz frente a la cara que mira al espectador (0–1) */
  contrast?: number
  /** Color del contorno exterior de 1 píxel */
  outline?: Color
  /** Color de las líneas donde una esfera tapa a otra que está detrás */
  lines?: Color
}

/** Diferencia de profundidad, en píxeles, a partir de la cual se dibuja línea entre dos esferas */
const LINE_DEPTH_GAP = 1.5

const LIGHT = normalize(-0.55, -0.75, 0.45)
const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const

function normalize(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z)
  return [x / len, y / len, z / len]
}

interface Hit {
  s: Sphere
  nz: number
  depth: number
}

function frontSphere(spheres: readonly Sphere[], px: number, py: number): Hit | undefined {
  let best: Hit | undefined
  for (const s of spheres) {
    const d2 = ((px - s.x) ** 2 + (py - s.y) ** 2) / (s.r * s.r)
    if (d2 > 1) continue
    const nz = Math.sqrt(1 - d2)
    const depth = (s.z ?? 0) + nz * s.r
    if (!best || depth > best.depth) best = { s, nz, depth }
  }
  return best
}

/** Pinta la unión de varias esferas como un solo volumen sombreado con la rampa `colors` (oscuro → claro) */
export function paintSpheres(pix: Pixmap, spheres: readonly Sphere[], colors: readonly Color[], opts: SphereOptions = {}) {
  const { floorY = Infinity, floorShade = 0, dither = 0, contrast = 0.85, outline, lines } = opts
  const minX = Math.floor(Math.min(...spheres.map((s) => s.x - s.r))) - 1
  const maxX = Math.ceil(Math.max(...spheres.map((s) => s.x + s.r))) + 1
  const minY = Math.floor(Math.min(...spheres.map((s) => s.y - s.r))) - 1
  const maxY = Math.min(Math.ceil(Math.max(...spheres.map((s) => s.y + s.r))), floorY)
  const w = maxX - minX
  const hits: (Hit | undefined)[] = []
  for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) hits.push(frontSphere(spheres, x + 0.5, y + 0.5))
  const at = (x: number, y: number) => (x < minX || x >= maxX || y < minY || y >= maxY ? undefined : hits[(y - minY) * w + (x - minX)])

  for (let y = minY; y < maxY; y++)
    for (let x = minX; x < maxX; x++) {
      const hit = at(x, y)
      if (!hit) continue
      const behind = lines !== undefined && NEIGHBORS.some(([dx, dy]) => {
        const n = at(x + dx, y + dy)
        return n !== undefined && n.s !== hit.s && n.depth - hit.depth > LINE_DEPTH_GAP
      })
      if (behind) {
        pix.set(x, y, lines)
        continue
      }
      const nx = (x + 0.5 - hit.s.x) / hit.s.r
      const ny = (y + 0.5 - hit.s.y) / hit.s.r
      const lit = nx * LIGHT[0] + ny * LIGHT[1] + hit.nz * LIGHT[2]
      let t = 0.5 + contrast * 0.5 * lit + (hit.s.tone ?? 0) * 0.15
      if (floorShade > 0) t -= floorShade * Math.max(0, 1 - (floorY - y) / 4)
      pix.set(x, y, ramp(colors, t, x, y, dither))
    }

  if (outline === undefined) return
  const bottom = Number.isFinite(floorY) ? maxY + 1 : maxY
  for (let y = minY; y < bottom; y++)
    for (let x = minX; x < maxX; x++)
      if (!at(x, y) && NEIGHBORS.some(([dx, dy]) => at(x + dx, y + dy))) pix.set(x, y, outline)
}
