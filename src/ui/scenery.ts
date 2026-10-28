// Fondos pixel-art por capas (parallax) para la escena de caminar, al estilo de las intros de GBA.
// Cada capa es una tesela SVG que se repite en horizontal; se dibuja en "píxeles GBA" y se escala x SCALE.
import type { Biome } from '../data/maps'

export const SCALE = 4

export interface SceneLayer {
  image: string
  w: number
  h: number
  /** Velocidad de desplazamiento en px de pantalla por segundo */
  speed: number
  anchor: 'top' | 'bottom'
  /** Distancia al borde de anclaje, en píxeles GBA */
  offset: number
}

export interface Scene {
  sky: string
  back: SceneLayer[]
  front: SceneLayer[]
  /** Altura de los pies del Pokémon sobre el borde inferior, en píxeles GBA */
  walkerBottom: number
  /** En el agua el Pokémon flota en lugar de dar saltitos */
  surf?: boolean
}

const rect = (x: number, y: number, w: number, h: number, c: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`

/** Elipse rellena fila a fila, para que los bordes queden escalonados como en un sprite */
function blob(cx: number, cy: number, rx: number, ry: number, c: string): string {
  let out = ''
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)))
    if (half > 0) out += rect(cx - half, cy + dy, half * 2, 1, c)
  }
  return out
}

/** Estalactita/estalagmita escalonada */
function spike(x: number, y: number, len: number, width: number, c: string, down: boolean): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    const w = Math.max(1, Math.round(((len - i) / len) * width))
    out += rect(x - Math.floor(w / 2), down ? y + i : y - i, w, 1, c)
  }
  return out
}

/** Dibuja la tesela también desplazada ±w para que las figuras que cruzan el borde encajen al repetir */
const tiled = (w: number, draw: (dx: number) => string) => draw(-w) + draw(0) + draw(w)

function tile(w: number, h: number, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`
  return { image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w, h }
}

const layer = (t: ReturnType<typeof tile>, speed: number, anchor: 'top' | 'bottom', offset: number): SceneLayer => ({
  ...t,
  speed,
  anchor,
  offset,
})

// ---------------------------------------------------------------- Piezas comunes

const clouds = tile(
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

const cloudsFar = tile(
  120,
  20,
  tiled(120, (d) => blob(24 + d, 10, 10, 3, '#eef9fd') + blob(30 + d, 8, 6, 3, '#eef9fd') + blob(84 + d, 13, 8, 2, '#eef9fd')),
)

/** Cordillera lejana, azulada por la distancia, con nieve en las cumbres */
const mountains = tile(
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

function tree(x: number, base: number, size: number, [dark, mid, light, trunk, trunkDark]: string[]) {
  const s = size
  return (
    rect(x - 3, base - s, 6, s, trunk) +
    rect(x - 3, base - s, 2, s, trunkDark) +
    blob(x, base - s - Math.round(s * 0.7), Math.round(s * 1.1), Math.round(s * 1.0), dark) +
    blob(x - 2, base - s - Math.round(s * 0.85), Math.round(s * 0.85), Math.round(s * 0.75), mid) +
    blob(x - 5, base - s - Math.round(s * 1.15), Math.round(s * 0.4), Math.round(s * 0.35), light)
  )
}

// ---------------------------------------------------------------- Prado (Ruta 1)

const MEADOW_TREE = ['#287838', '#3a9048', '#60b860', '#7a4a28', '#5a3418']

const meadow: Scene = {
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

// ---------------------------------------------------------------- Bosque Verde

const FOREST_TREE = ['#1e5a2a', '#2a7036', '#4a9a48', '#5a3a20', '#3e2614']

const forest: Scene = {
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

// ---------------------------------------------------------------- Monte Moon

const cave: Scene = {
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

// ---------------------------------------------------------------- Ruta Marina

const sea: Scene = {
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

export const SCENES: Record<Biome, Scene> = { meadow, forest, cave, sea }
