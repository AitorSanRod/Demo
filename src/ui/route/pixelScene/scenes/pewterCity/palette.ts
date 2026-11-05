// Colores de Ciudad Plateada de día: el cielo y las nubes del prado, montañas rocosas grises y pardas, edificios de
// piedra gris con tejados de colores, el museo de piedra clara, el gimnasio de roca y calles de losas grises.
// Cada rampa va de oscuro a claro.

import { hex, palette, TRANSPARENT } from '../../paint/pixmap'

/** Cordillera lejana, azulada por la distancia */
export const FAR_MOUNTAINS = palette('#6a86a8', '#7a96b6', '#8ea8c4', '#a4bcd2')
/** Montañas rocosas cercanas: grieta, sombra, base, luz y cara al sol */
export const MOUNTAINS = palette('#6a6260', '#82786e', '#9a8e7e', '#b4a690', '#cec0a4')

/** Césped: sombra, base, luz y brillo */
export const LAWN = palette('#5aa838', '#6cbc40', '#84cc4c', '#9cd85c')
/** Setos recortados: hueco, sombra, base, luz y brillo */
export const HEDGE = { colors: palette('#1a5a2a', '#277534', '#3a9040', '#58aa48', '#7cc458'), ink: hex('#124420') }

/** Losas de piedra de calles y aceras: sombra, base, luz y brillo; `MORTAR`, juntas */
export const PAVING = palette('#a0a0a6', '#b0b0b4', '#bcbcbe', '#cacac8')
export const MORTAR = hex('#86868e')
/** Bordillo: sombra, base y canto iluminado */
export const CURB = palette('#7e7e86', '#b4b4b8', '#e2e2e0')

const STONE_WALL = { wall: palette('#8c8e98', '#a4a6ae', '#c4c6cc', '#dfe0e4'), wallInk: hex('#4a4c56') }
const WINDOWS = { wood: palette('#4a3a34', '#6e5a4e', '#9a8270'), glass: palette('#3c7cc0', '#5ea8e0', '#d8f0fc'), brick: palette('#6e6a6a', '#8e8888', '#aea8a6') }

export const RED_HOUSE = { roof: palette('#b83a2e', '#d8503a', '#f07858'), roofInk: hex('#5e1a16'), ...STONE_WALL, ...WINDOWS }
export const BLUE_HOUSE = { roof: palette('#3a64b0', '#4a80d0', '#70a0e8'), roofInk: hex('#1a2c5c'), ...STONE_WALL, ...WINDOWS }
export const GREEN_HOUSE = { roof: palette('#2e7a4a', '#3c955a', '#5cb070'), roofInk: hex('#143a24'), ...STONE_WALL, ...WINDOWS }
export const SLATE_HOUSE = { roof: palette('#4c5266', '#626a80', '#80889c'), roofInk: hex('#262a38'), ...STONE_WALL, ...WINDOWS }

/** Museo: piedra clara, frontón de tejado gris y pórtico en sombra */
export const MUSEUM = {
  stone: palette('#a8a49a', '#c8c4b8', '#e2ded2', '#f6f4ec'),
  ink: hex('#5a564e'),
  roof: palette('#6a6e7c', '#8a8e9a', '#aeb2bc'),
  shadow: palette('#3e3c44', '#5a5862'),
}
/** Gimnasio: sillares grises y pardos, puerta de madera oscura y peñascos */
export const GYM = {
  stone: palette('#5a5650', '#7e7870', '#9a9286', '#b6ae9e', '#d0c8b6'),
  ink: hex('#3a3632'),
  door: palette('#3a2a22', '#5a4232', '#7e5e46'),
  rocks: { colors: palette('#4e5058', '#686a72', '#84868c', '#a2a4a8', '#c0c2c4'), ink: hex('#34363c') },
}

/** Farolas de día: hierro y cristal apagado, sin halo */
export const LAMP = {
  iron: palette('#2a2c36', '#3e404c', '#565866', '#787a88'),
  light: palette('#a8b4c0', '#d8e2ea', '#f4f8fc'),
  glow: TRANSPARENT,
}

export const FOUNTAIN = {
  stone: palette('#9aa0ac', '#c4c8d0', '#e4e6ec'),
  stoneInk: hex('#4a4e5a'),
  water: palette('#3a8ad8', '#6ab8f0', '#d8f0ff'),
}
