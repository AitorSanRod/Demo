// Piezas que comparten varios biomas
import { rect, blob, spike, tiled, tile } from './draw'

export const clouds = tile(
  160,
  36,
  tiled(
    160,
    (d) =>
      blob(30 + d, 21, 17, 6, '#d4eefa') +
      blob(30 + d, 18, 17, 6, '#ffffff') +
      blob(44 + d, 14, 11, 6, '#ffffff') +
      blob(112 + d, 25, 13, 4, '#d4eefa') +
      blob(112 + d, 23, 13, 4, '#ffffff') +
      blob(122 + d, 20, 8, 4, '#ffffff'),
  ),
)

export const cloudsFar = tile(
  120,
  20,
  tiled(120, (d) => blob(24 + d, 10, 10, 3, '#eef9fd') + blob(30 + d, 8, 6, 3, '#eef9fd') + blob(84 + d, 13, 8, 2, '#eef9fd')),
)

/** Cordillera lejana, azulada por la distancia, con nieve en las cumbres */
export const mountains = tile(
  160,
  56,
  rect(0, 50, 160, 6, '#a8c8e0') +
    tiled(
      160,
      (d) =>
        spike(40 + d, 56, 46, 84, '#a8c8e0', false) +
        spike(40 + d, 56 - 40, 6, 12, '#f0f8ff', false) +
        spike(116 + d, 56, 36, 70, '#b4d2e8', false) +
        spike(116 + d, 56 - 30, 6, 12, '#f0f8ff', false),
    ),
)

export function tree(x: number, base: number, size: number, [dark, mid, light, trunk, trunkDark]: string[]) {
  const s = size
  return (
    rect(x - 3, base - s, 6, s, trunk) +
    rect(x - 3, base - s, 2, s, trunkDark) +
    blob(x, base - s - Math.round(s * 0.7), Math.round(s * 1.1), Math.round(s * 1.0), dark) +
    blob(x - 2, base - s - Math.round(s * 0.85), Math.round(s * 0.85), Math.round(s * 0.75), mid) +
    blob(x - 5, base - s - Math.round(s * 1.15), Math.round(s * 0.4), Math.round(s * 0.35), light)
  )
}
