// Césped con degradado suave (más claro al fondo y variando a lo largo) y senderos ondulados que lo recorren.

import { periodicWave, valueNoise, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'
import { ramp } from '../paint/shade'

/** Celda del ruido que aclara u oscurece el césped a lo largo, en píxeles de arte (manchas muy anchas y suaves) */
const SWEEP_CELL = 60
/** Marcas de hierba por cada 100 píxeles de ancho */
const MARKS_PER_100 = 6

/**
 * Césped de `height` píxeles con el borde de arriba ondulado. `colors` va de oscuro a claro: el borde lleva el más
 * claro y hacia delante se oscurece en bandas. Devuelve la fila del borde en cada columna.
 */
export function lawn(pix: Pixmap, rng: Rng, height: number, colors: readonly Color[], seed: number): (x: number) => number {
  const phase = () => rng() * Math.PI * 2
  const waves: [number, number, number][] = [[2, 2.5, phase()], [5, 1.2, phase()]]
  const top = (x: number) => Math.round(pix.h - height + periodicWave(x, pix.w, waves))
  const tone = (x: number, y: number) => {
    const depth = (y - top(x)) / (pix.h - top(x))
    return 0.8 - depth * 0.55 + (valueNoise(x, 0, SWEEP_CELL, pix.w, seed) - 0.5) * 0.35
  }
  for (let x = 0; x < pix.w; x++)
    for (let y = top(x); y < pix.h; y++) pix.set(x, y, y - top(x) < 2 ? colors[colors.length - 1] : ramp(colors, tone(x, y), x, y, 0))
  const marks = Math.round((pix.w / 100) * MARKS_PER_100)
  for (let i = 0; i < marks; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(top(x) + 4 + rng() * (height - 6))
    const dark = ramp(colors, tone(x, y) - 0.3, x, y, 0)
    for (const [dx, dy] of [[0, 0], [1, -1], [2, 0]]) pix.set(x + dx, y + dy, dark)
  }
  return top
}

/** Colores de un sendero: relleno, borde de arriba (en sombra) y borde de abajo (contorno) */
interface LaneColors {
  fill: Color
  top: Color
  ink: Color
}

/**
 * Sendero que recorre el césped a `offset` píxeles bajo su borde, ondulando por su cuenta (`wander` píxeles arriba y
 * abajo). Devuelve la fila del sendero en cada columna.
 */
export function lane(pix: Pixmap, top: (x: number) => number, offset: number, thickness: number, colors: LaneColors, wander = 0, phase = 0) {
  const laneY = (x: number) => top(x) + offset + Math.round(periodicWave(x, pix.w, [[3, wander, phase]]))
  for (let x = 0; x < pix.w; x++) {
    const y = laneY(x)
    pix.rect(x, y, 1, thickness, colors.fill)
    pix.set(x, y, colors.top)
    pix.set(x, y + thickness, colors.ink)
  }
  return laneY
}
