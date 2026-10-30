// Escena del bioma Ruta Marina
import { clouds, cloudsFar } from './common'
import { rect, blob, tiled, tile, layer, type Scene } from './draw'

export const sea: Scene = {
  sky: 'linear-gradient(#58a8f0, #a8dcf8 50%, #d8f4ff)',
  walkerBottom: 15,
  surf: true,
  back: [
    layer(clouds, 8, 'top', 34),
    layer(cloudsFar, 4, 'top', 62),
    layer(
      tile(
        200,
        36,
        rect(0, 31, 200, 5, '#4a9ae8') +
          tiled(
            200,
            (d) =>
              blob(50 + d, 31, 24, 6, '#e8d8a0') +
              blob(50 + d, 27, 14, 6, '#48a858') +
              rect(58 + d, 10, 2, 16, '#8a6038') +
              blob(60 + d, 10, 7, 3, '#38904a') +
              blob(150 + d, 32, 14, 4, '#e8d8a0') +
              blob(150 + d, 30, 8, 3, '#58b868'),
          ),
      ),
      12,
      'bottom',
      74,
    ),
    layer(
      tile(64, 30, rect(0, 0, 64, 30, '#3890e0') + rect(6, 6, 10, 1, '#68b8f8') + rect(36, 14, 12, 1, '#68b8f8') + rect(20, 22, 8, 1, '#68b8f8')),
      40,
      'bottom',
      46,
    ),
    layer(
      tile(
        48,
        48,
        rect(0, 0, 48, 48, '#2878d0') +
          rect(0, 0, 48, 2, '#58a8f0') +
          rect(4, 10, 12, 1, '#58a8f0') +
          rect(5, 9, 6, 1, '#e8f8ff') +
          rect(28, 20, 14, 1, '#58a8f0') +
          rect(30, 19, 6, 1, '#e8f8ff') +
          rect(10, 32, 10, 1, '#58a8f0') +
          rect(36, 40, 8, 1, '#58a8f0'),
      ),
      90,
      'bottom',
      0,
    ),
  ],
  front: [layer(tile(64, 8, rect(0, 4, 64, 4, '#e8f8ff') + rect(10, 2, 14, 2, '#e8f8ff') + rect(40, 3, 10, 1, '#e8f8ff')), 130, 'bottom', 0)],
}
