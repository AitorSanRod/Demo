// Escena del bioma Bosque Verde
import { rect, blob, tiled, tile, layer, type Scene } from './draw'
import { tree } from './common'

const FOREST_TREE = ['#1e5a2a', '#2a7036', '#4a9a48', '#5a3a20', '#3e2614']

export const forest: Scene = {
  sky: 'linear-gradient(#0f2e1e, #1e4a2c 55%, #2c6034)',
  walkerBottom: 17,
  back: [
    layer(
      tile(
        96,
        80,
        rect(0, 34, 96, 46, '#173f22') +
          tiled(96, (d) => blob(12 + d, 34, 14, 16, '#173f22') + blob(42 + d, 28, 17, 18, '#173f22') + blob(76 + d, 34, 15, 13, '#173f22')),
      ),
      14,
      'bottom',
      60,
    ),
    layer(
      tile(
        128,
        96,
        rect(0, 86, 128, 10, '#2a6a30') +
          tiled(
            128,
            (d) =>
              rect(20 + d, 10, 14, 80, '#4a3020') +
              rect(22 + d, 10, 3, 80, '#6a4a30') +
              blob(27 + d, 8, 30, 16, '#245e2e') +
              blob(24 + d, 4, 20, 9, '#2f7238') +
              tree(92 + d, 88, 14, FOREST_TREE) +
              blob(62 + d, 88, 14, 8, '#2f7a38'),
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
        rect(0, 0, 48, 6, '#3f8a3a') +
          rect(0, 6, 48, 2, '#2a6a2a') +
          rect(0, 8, 48, 20, '#9a7a50') +
          rect(0, 8, 48, 2, '#7a5a38') +
          rect(8, 16, 4, 1, '#7a5a38') +
          rect(34, 22, 3, 1, '#7a5a38') +
          rect(20, 12, 2, 1, '#c89040') +
          rect(42, 18, 2, 1, '#c86030') +
          rect(0, 28, 48, 2, '#2a6a2a') +
          rect(0, 30, 48, 10, '#357a35') +
          rect(14, 32, 4, 2, '#e04848') +
          rect(15, 32, 1, 1, '#ffffff') +
          rect(15, 34, 2, 2, '#f0e0c0'),
      ),
      90,
      'bottom',
      0,
    ),
  ],
  front: [
    layer(
      tile(80, 16, tiled(80, (d) => blob(14 + d, 16, 12, 9, '#1a4e24') + blob(16 + d, 15, 7, 5, '#2a6a30') + blob(56 + d, 16, 9, 7, '#1a4e24'))),
      130,
      'bottom',
      0,
    ),
  ],
}
