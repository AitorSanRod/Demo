// Colores del Bosque Verde, a partir de la referencia de árboles grandes, oscurecidos para un bosque cerrado:
// bruma verde oscura, troncos lejanos apagados, copas con sombras profundas, troncos con vetas naranjas y tierra húmeda.
// Cada rampa va de oscuro a claro; `*_INK` es el contorno del lado de sombra.

import { hex, palette } from '../../paint/pixmap'

/** Bruma que se ve entre los árboles: oscura, para que el bosque se sienta cerrado */
export const HAZE = palette('#8cb89c', '#7aaa8c', '#6a9c7e', '#5a8e70')
export const FAR_TRUNKS = palette('#4e7e64', '#5c8c70', '#6c9a7c')
export const FAR_LEAVES = { colors: palette('#356e52', '#3f7c5c', '#4c8a66', '#5c9a72', '#70aa80'), ink: hex('#2e6248') }
export const MID_TRUNKS = palette('#4a5236', '#5a6240', '#6e764c')
export const MID_LEAVES = { colors: palette('#143c22', '#1d4e2a', '#2a6232', '#3e7a3c', '#5a9446'), ink: hex('#10341c') }
/** Banda de copas de arriba: hueco, sombra, base, luz y brillo */
export const CANOPY = { colors: palette('#0e2c16', '#16401e', '#205426', '#2e6a2e', '#4a8438'), ink: hex('#0a2410') }
export const NEAR_LEAVES = { colors: palette('#0e3418', '#174a20', '#225e28', '#337a32', '#56983e'), ink: hex('#0a2a12') }
/** Troncos cercanos: oscuro, sombra, base, luz y brillo (la cara izquierda, naranja) */
export const NEAR_TRUNK = { colors: palette('#3e2614', '#5e3a1e', '#84522a', '#b8743a', '#dc9a52'), ink: hex('#24160a') }
/** Suelo del bosque (musgo): sombra, base, luz y brillo */
export const FLOOR = palette('#22521f', '#2c6426', '#38782e', '#4c8c36')
/** Hierba de los bordes del camino: contorno, sombra, base, luz y brillo */
export const FOREST_GRASS = palette('#1a4e1e', '#246224', '#30762c', '#448c36', '#62a644')
export const FOREST_GRASS_INK = hex('#1a4c1c')
/** Tierra húmeda del camino: sombra, base, luz y brillo */
export const DARK_DIRT = palette('#6a4628', '#7e5630', '#94683a', '#aa7c48')
export const DARK_DIRT_INK = hex('#4e321a')
/** Hojas caídas sobre el camino */
export const FALLEN_LEAVES = [hex('#c8782c'), hex('#e0a040'), hex('#8aa83a')]
export const FERN = palette('#0c3220', '#164a2c', '#22633a', '#347c46')
export const ROCK = { colors: palette('#5a5e62', '#7a8086', '#9aa0a6'), ink: hex('#3a3c40') }
export const MUSHROOM = { cap: palette('#b03028', '#d84a38', '#f07a5c'), capInk: hex('#5a1410'), spots: hex('#fff4e8'), stem: palette('#c8b898', '#ece2c8') }
export const LOG = {
  bark: palette('#3e2614', '#5a3a20', '#77502c', '#946838'),
  barkInk: hex('#24160a'),
  rings: palette('#a8743c', '#e0b878'),
  hollow: hex('#1e120a'),
  moss: palette('#2c642a', '#488c36', '#6aac46'),
}
export const WOOD = palette('#583018', '#805028', '#a06830', '#c88848', '#e8b068')
/** Rayos de luz: color y opacidad del centro arriba del todo (se desvanecen hacia abajo) */
export const RAY = { color: '#fff6c8', alpha: 0.26 }
