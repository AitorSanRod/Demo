// Piezas que comparten varios biomas
import { blob, tiled, tile } from './draw'

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
