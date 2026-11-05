// Colores del prado, sacados de la captura de referencia: cielo azul limpio, colinas azuladas y verdes,
// llanura verde viva y camino naranja. Cada rampa va de oscuro a claro.

import { hex, palette } from '../../paint/pixmap'

export const SKY = palette('#1784e4', '#2290ea', '#34a0ee', '#4caef0', '#68bcf2', '#88ccf4')
export const CLOUD = palette('#a8c4ec', '#c8dcf4', '#e8f2fc', '#ffffff')
export const FAR_HILLS = palette('#4898ac', '#58a8b4', '#6cb8bc', '#88c8c4')
export const HILLS = palette('#2c8448', '#38984e', '#4aaa56', '#60bc60')
/** Llanura: sombra, base, luz y brillo */
export const MEADOW = palette('#80bc30', '#98cc3a', '#aad648', '#c0e25c')
/** Árboles de la llanura: hueco, sombra, base, luz y brillo */
export const MEADOW_TREES = palette('#164e26', '#1f6a2e', '#2c8038', '#3c9640', '#58ac48')
export const TRUNK = palette('#4a2c16', '#6e4222', '#93592c', '#c27e3e', '#e0a458')
/** Hojas oscuras de primer plano: borde, sombra, cara iluminada y nervio */
export const FERN = palette('#0f3a28', '#1a5434', '#26703e', '#3a8a48')
/** Plantas de hoja ancha: borde, sombra, cara iluminada y nervio */
export const PLANTS = palette('#12502a', '#20702f', '#3c9e3a', '#62ba4c')
/** Copas de los árboles cercanos: hueco, sombra, base, luz y brillo */
export const NEAR_TREES = palette('#14481f', '#1d642b', '#2c7e34', '#46983c', '#6cb44a')
export const NEAR_TREES_INK = hex('#0e3a1a')
export const TRUNK_INK = hex('#2e1a0c')
/** Hierba: contorno, sombra, base, luz y brillo */
export const GRASS = palette('#2a7a2a', '#3c9a32', '#58b83a', '#78cc44', '#98dc58')
export const GRASS_INK = hex('#246a26')
/** Tierra del camino: sombra, base, luz y brillo */
export const DIRT = palette('#e4903a', '#eea44a', '#f4b45a', '#f8c674')
export const DIRT_INK = hex('#c07430')
export const HOUSE = {
  roof: palette('#b83a2e', '#d8503a', '#f07858'),
  roofInk: hex('#5e1a16'),
  wall: palette('#c4ae84', '#dccca4', '#f0e6c8', '#fcf6e4'),
  wallInk: hex('#5a4a34'),
  wood: palette('#5a3418', '#8a5428', '#b47a3c'),
  glass: palette('#3c7cc0', '#5ea8e0', '#d8f0fc'),
  brick: palette('#7e3e28', '#a85a3c', '#c87a58'),
}
export const WOOD = palette('#583018', '#805028', '#a06830', '#c88848', '#e8b068')

export const DAISY = { petals: hex('#ffffff'), shade: hex('#d4d8e4'), center: hex('#f4c020') }
export const BUTTERCUP = { petals: hex('#f8d030'), shade: hex('#d89a18'), center: hex('#c06a10') }
