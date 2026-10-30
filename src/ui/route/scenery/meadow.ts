// Escena del bioma Prado (Ruta 1 y Pueblo Paleta)
import { clouds, cloudsFar, mountains, tree } from './common'
import { rect, blob, tiled, tile, layer, type Scene } from './draw'

const MEADOW_TREE = ['#287838', '#3a9048', '#60b860', '#7a4a28', '#5a3418']

export const meadow: Scene = {
  sky: 'linear-gradient(#68b0f0, #a8dcf8 55%, #d8f4f8)',
  walkerBottom: 17,
  back: [
    layer(clouds, 8, 'top', 34),
    layer(cloudsFar, 4, 'top', 62),
    layer(mountains, 6, 'bottom', 84),
    layer(
      tile(128, 48, tiled(128, (d) => blob(32 + d, 42, 36, 26, '#8cc8a8') + blob(98 + d, 46, 42, 22, '#9ed4b0')) + rect(0, 42, 128, 6, '#8cc8a8')),
      18,
      'bottom',
      62,
    ),
    layer(
      tile(
        112,
        64,
        rect(0, 54, 112, 10, '#58a848') +
          tiled(112, (d) => tree(24 + d, 56, 13, MEADOW_TREE) + tree(80 + d, 56, 9, MEADOW_TREE) + blob(54 + d, 55, 10, 5, '#3a9048')),
      ),
      42,
      'bottom',
      36,
    ),
    layer(
      tile(
        48,
        40,
        rect(0, 0, 48, 6, '#70c858') +
          rect(0, 6, 48, 2, '#489838') +
          rect(0, 8, 48, 20, '#e8d090') +
          rect(0, 8, 48, 2, '#c8a868') +
          rect(6, 14, 2, 1, '#c0a060') +
          rect(30, 20, 3, 1, '#c0a060') +
          rect(40, 12, 1, 1, '#b09050') +
          rect(18, 24, 2, 1, '#c0a060') +
          rect(0, 28, 48, 2, '#489838') +
          rect(0, 30, 48, 10, '#58b048') +
          rect(10, 33, 2, 2, '#f85858') +
          rect(10, 33, 1, 1, '#ffd0d0') +
          rect(34, 35, 2, 2, '#f8f8f8') +
          rect(34, 35, 1, 1, '#f8e060') +
          rect(24, 34, 1, 3, '#389030') +
          rect(26, 33, 1, 4, '#389030'),
      ),
      90,
      'bottom',
      0,
    ),
  ],
  front: [
    layer(
      tile(72, 12, [4, 10, 13, 30, 34, 52, 58, 61].map((x) => rect(x, 4, 2, 8, '#2f8a30') + rect(x, 2, 1, 2, '#48a840')).join('')),
      130,
      'bottom',
      0,
    ),
  ],
}
