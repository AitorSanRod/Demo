// Colores de Pueblo Paleta: césped, tejados naranja/rojo/azul/gris, paredes claras, vallas blancas,
// camino de arena y plaza de piedra. Cada rampa va de oscuro a claro.

import { hex, palette } from '../../paint/pixmap'

/** Césped del pueblo: sombra, base, luz y brillo */
export const LAWN = palette('#5aa838', '#6cbc40', '#84cc4c', '#9cd85c')

const CREAM_WALL = { wall: palette('#d8c8a0', '#f0e6c8', '#fcf6e4'), wallInk: hex('#5a4a34') }
const WINDOWS = { wood: palette('#5a3418', '#8a5428', '#b47a3c'), glass: palette('#5ea8e0', '#c8e8f8'), brick: hex('#a85a3c') }

export const ORANGE_HOUSE = { roof: palette('#c05a28', '#e07838', '#f89a58'), roofInk: hex('#5e2410'), ...CREAM_WALL, ...WINDOWS }
export const RED_HOUSE = { roof: palette('#b83a2e', '#d8503a', '#f07858'), roofInk: hex('#5e1a16'), ...CREAM_WALL, ...WINDOWS }
export const BLUE_HOUSE = { roof: palette('#3a64b0', '#4a80d0', '#70a0e8'), roofInk: hex('#1a2c5c'), ...CREAM_WALL, ...WINDOWS }
/** Edificio grande: paredes blancas y tejado gris */
export const BIG_BUILDING = {
  roof: palette('#7a7e8c', '#9aa0ac', '#c0c4cc'),
  roofInk: hex('#3a3c48'),
  wall: palette('#ccd2dc', '#eef1f6', '#ffffff'),
  wallInk: hex('#4a505c'),
  ...WINDOWS,
}

export const FENCE = { colors: palette('#b8bcc8', '#f2f2ee', '#ffffff'), ink: hex('#6a7080') }
export const SOIL = { colors: palette('#6a4428', '#8a5a34', '#a8743e'), ink: hex('#4a2c16') }
/** Flores de los parterres: [pétalo, brillo] */
export const BED_FLOWERS = [
  [hex('#e83838'), hex('#ff9090')],
  [hex('#f8d030'), hex('#fff0a0')],
  [hex('#f070b0'), hex('#ffc0e0')],
  [hex('#f4f4f4'), hex('#ffffff')],
]
/** Matas de los jardines: hueco, sombra, base, luz y brillo */
export const GARDEN_BUSH = { colors: palette('#1a5a2a', '#277534', '#3a9040', '#58aa48', '#7cc458'), ink: hex('#124420') }

/** Arena del camino: sombra, base, luz y brillo */
export const SAND = palette('#d4b070', '#e4c688', '#f0d8a4', '#f8e8c4')
export const SAND_INK = hex('#b08a50')
/** Baldosas de la plaza: sombra, base, luz y brillo; `MORTAR`, juntas */
export const PAVING = palette('#b4ac9a', '#c8c0ae', '#dcd6c6', '#ece8dc')
export const MORTAR = hex('#8c8474')

export const FOUNTAIN = {
  stone: palette('#9aa0ac', '#c4c8d0', '#e4e6ec'),
  stoneInk: hex('#4a4e5a'),
  water: palette('#3a8ad8', '#6ab8f0', '#d8f0ff'),
}
