// Colores de Ciudad Plateada al atardecer: cielo de violeta a naranja, montañas rocosas, edificios de piedra
// gris templada por la luz cálida, calles empedradas y farolas encendidas. Cada rampa va de oscuro a claro.

import { hex, palette, rgba } from '../../paint/pixmap'

/** Cielo de arriba (violeta) al horizonte (naranja claro) */
export const SKY = palette('#3c3a78', '#5a4688', '#80508e', '#a85a8c', '#cc6a84', '#e8806e', '#f69a62', '#fbb66a')
/** Sol bajo: halo, borde y centro */
export const SUN = { glow: rgba('#ffd890', 0.35), rim: hex('#ffd27a'), core: hex('#fff1c4') }
/** Nubes del atardecer: sombra violeta, rosa, salmón y canto iluminado */
export const CLOUD = palette('#8e5c8e', '#c47a94', '#eea092', '#ffd2a6')
/** Cordillera lejana, azulada por la distancia */
export const FAR_MOUNTAINS = palette('#6a4e7a', '#7c5a84', '#906890', '#a6789a')
/** Montañas rocosas cercanas: grieta, sombra, base, luz y cara al sol */
export const MOUNTAINS = palette('#5a3e4a', '#744c50', '#8e5c56', '#ac705c', '#cc8a66')

/** Césped del atardecer: sombra, base, luz y brillo */
export const LAWN = palette('#4a7a3c', '#5a8c42', '#6e9e48', '#88b052')
/** Copas: hueco, sombra, base, luz y brillo */
export const TREES = palette('#1c3826', '#284e30', '#386636', '#52803e', '#76984a')
export const TREES_INK = hex('#142a1c')
/** Setos recortados: hueco, sombra, base, luz y brillo */
export const HEDGE = { colors: palette('#1a3a24', '#245030', '#326838', '#4a8240', '#6c9c4c'), ink: hex('#122a1a') }

/** Losas de piedra de calles y aceras: sombra, base, luz y brillo; `MORTAR`, juntas */
export const PAVING = palette('#7c7282', '#8e8492', '#9e929c', '#b2a3a6')
export const MORTAR = hex('#5e5468')
/** Bordillo: sombra, base y canto iluminado */
export const CURB = palette('#6e6676', '#a49aa2', '#d6c6bc')

const STONE_WALL = { wall: palette('#7e7480', '#968a92', '#b6a8a8', '#d4c2b8'), wallInk: hex('#463e4c') }
const SANDSTONE_WALL = { wall: palette('#8e7462', '#a8866e', '#c8a282', '#e2bc98'), wallInk: hex('#4e3a30') }
/** Ventanas encendidas: marco (oscuro, base y luz) y luz de dentro (sombra, base y reflejo) */
const LIT = { wood: palette('#3e2a28', '#5e4038', '#8a6450'), glass: palette('#c47a3a', '#f2b456', '#fff0b0'), brick: palette('#5e3a36', '#7e4e44', '#a06a58') }
/** Ventanas que reflejan el cielo */
const DUSK = { ...LIT, glass: palette('#6a5a96', '#c47c9a', '#ffd2b4') }

export const SLATE_HOUSE = { roof: palette('#3e4262', '#525878', '#727896'), roofInk: hex('#22243c'), ...STONE_WALL, ...LIT }
export const TEAL_HOUSE = { roof: palette('#2a585e', '#386e72', '#56908a'), roofInk: hex('#16323a'), ...STONE_WALL, ...DUSK }
export const RUST_HOUSE = { roof: palette('#6e342e', '#8c4438', '#b0624a'), roofInk: hex('#3a1a18'), ...SANDSTONE_WALL, ...LIT }
/** Edificio grande (el museo): piedra arenisca y tejado de pizarra */
export const MUSEUM = { roof: palette('#3e4262', '#525878', '#727896'), roofInk: hex('#22243c'), ...SANDSTONE_WALL, ...DUSK }

/** Farolas: hierro (contorno, sombra, base y luz), cristal encendido (borde, base, centro) y halo */
export const LAMP = {
  iron: palette('#1e1a28', '#302a3c', '#463e56', '#6a6080'),
  light: palette('#e8a040', '#ffd668', '#fff6c8'),
  glow: rgba('#ffd890', 0.28),
}

export const FOUNTAIN = {
  stone: palette('#867c88', '#ada0a6', '#d2c2ba'),
  stoneInk: hex('#463e4c'),
  water: palette('#4a6ab0', '#8a9ad0', '#ffd8c0'),
}
/** Madera del cartel: oscuro, sombra, base, luz y brillo */
export const WOOD = palette('#4a2c22', '#6e4430', '#8e5a3a', '#b87a50', '#d89c6a')
