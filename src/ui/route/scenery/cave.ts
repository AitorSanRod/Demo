// Escena del bioma Monte Moon
import { rect, blob, spike, tiled, tile, layer, type Scene } from './draw'

export const cave: Scene = {
  sky: 'radial-gradient(ellipse at 50% 35%, #3a3152, #1a1626 75%)',
  walkerBottom: 17,
  back: [
    layer(
      tile(
        80,
        40,
        rect(0, 0, 80, 6, '#2a2440') +
          spike(10, 6, 22, 7, '#3a3354', true) +
          spike(34, 6, 12, 5, '#332d4a', true) +
          spike(58, 6, 30, 8, '#3a3354', true) +
          spike(72, 6, 9, 4, '#332d4a', true),
      ),
      20,
      'top',
      0,
    ),
    layer(
      tile(120, 60, rect(0, 52, 120, 8, '#2a2540') + tiled(120, (d) => blob(30 + d, 60, 30, 30, '#2a2540') + blob(92 + d, 60, 26, 22, '#302a48'))),
      16,
      'bottom',
      60,
    ),
    layer(
      tile(
        140,
        90,
        rect(0, 84, 140, 6, '#3a3352') +
          tiled(
            140,
            (d) =>
              rect(30 + d, 0, 18, 90, '#463e60') +
              rect(32 + d, 0, 4, 90, '#5a5278') +
              rect(44 + d, 0, 2, 90, '#3a3352') +
              spike(100 + d, 86, 26, 12, '#463e60', false) +
              rect(118 + d, 74, 3, 10, '#7cc4f8') +
              rect(119 + d, 72, 1, 2, '#c8ecff') +
              rect(122 + d, 78, 2, 6, '#9fd8ff'),
          ),
      ),
      40,
      'bottom',
      34,
    ),
    layer(
      tile(
        48,
        40,
        rect(0, 0, 48, 6, '#4a4262') +
          rect(0, 6, 48, 2, '#3a3352') +
          rect(0, 8, 48, 20, '#6a6084') +
          rect(0, 8, 48, 2, '#544a6c') +
          rect(10, 14, 5, 1, '#544a6c') +
          rect(30, 22, 4, 1, '#544a6c') +
          rect(36, 12, 1, 1, '#8a80a6') +
          rect(0, 28, 48, 12, '#3a3352') +
          rect(40, 32, 1, 1, '#9fd8ff') +
          rect(12, 36, 1, 1, '#9fd8ff'),
      ),
      90,
      'bottom',
      0,
    ),
  ],
  front: [
    layer(
      tile(96, 10, tiled(96, (d) => blob(20 + d, 10, 8, 5, '#2a2440') + blob(64 + d, 10, 5, 3, '#2a2440') + blob(82 + d, 10, 3, 2, '#332d4a'))),
      130,
      'bottom',
      0,
    ),
  ],
}
