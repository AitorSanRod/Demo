// Rampas de color pixel-art: bandas limpias con un poco de tramado Bayer solo en el paso entre dos tonos.

import type { Color, Pixmap } from './pixmap'

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

/** Anchura por defecto de la franja tramada entre dos tonos (fracción de la banda; 0 = bandas limpias, 1 = degradado entero) */
const DITHER = 0

/** Elige un color de la rampa (oscuro → claro) para `t` en [0, 1], tramando solo cerca del paso entre dos tonos */
export function ramp(colors: readonly Color[], t: number, x: number, y: number, dither = DITHER): Color {
  const scaled = Math.min(0.9999, Math.max(0, t)) * (colors.length - 1)
  const i = Math.floor(scaled)
  if (i >= colors.length - 1) return colors[colors.length - 1]
  const f = dither > 0 ? Math.min(1, Math.max(0, (scaled - i - 0.5) / dither + 0.5)) : scaled - i
  const threshold = dither > 0 ? BAYER4[(y & 3) * 4 + (x & 3)] : 0.5
  return f > threshold ? colors[i + 1] : colors[i]
}

/** Degradado vertical a bandas, de `colors[0]` arriba a `colors[n-1]` abajo */
export function verticalGradient(pix: Pixmap, colors: readonly Color[], top = 0, height = pix.h, dither = DITHER) {
  for (let y = top; y < top + height; y++)
    for (let x = 0; x < pix.w; x++) pix.set(x, y, ramp(colors, (y - top) / (height - 1), x, y, dither))
}
