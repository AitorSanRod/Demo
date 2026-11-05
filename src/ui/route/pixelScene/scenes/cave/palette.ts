// Colores de la cueva (Monte Moon): penumbra violeta, roca más clara cuanto más cerca, cristales azules que
// brillan y suelo de roca con charcos. Cada rampa va de oscuro a claro; `ink` es el contorno del lado de sombra.

import { hex, palette, rgba } from '../../paint/pixmap'

/** Fondo de la cueva, de arriba (casi negro) a abajo */
export const GLOOM = palette('#120e1e', '#18122a', '#1e1834', '#251e3e', '#2c2448')
/** Roca del fondo: hueco, sombra, base, luz y brillo */
export const FAR_ROCK = { colors: palette('#241d38', '#2e2546', '#382e54', '#443862', '#524470'), ink: hex('#1a1428') }
export const MID_ROCK = { colors: palette('#2e2646', '#3a3056', '#483c68', '#58497a', '#6c5c8e'), ink: hex('#201a32') }
export const NEAR_ROCK = { colors: palette('#352c50', '#463a64', '#5a4c7a', '#706090', '#8a7aaa'), ink: hex('#1e1830') }
/** Techo: la roca que cubre la parte de arriba de la pantalla */
export const CEILING = { colors: palette('#140f20', '#1c152c', '#251c38', '#302546', '#3c2f54'), ink: hex('#0e0a18') }

/** Cristales: borde, base, luz y brillo, y su halo */
export const CRYSTAL = { colors: palette('#2a4a8e', '#4a86d4', '#8cc8f6', '#e4f6ff'), glow: rgba('#8cc8f6', 0.1) }
/** Cristales lejanos, apagados */
export const FAR_CRYSTAL = { colors: palette('#2a3a6e', '#3e62a0', '#6a9ad0', '#a8d0f0'), glow: rgba('#6a9ad0', 0.1) }

/** Suelo del camino: sombra, base, luz y brillo */
export const FLOOR = palette('#2e2642', '#3a3052', '#463a60', '#54486e')
export const FLOOR_INK = hex('#201a30')
/** Charcos: fondo, reflejo del cristal y brillo */
export const PUDDLE = palette('#233462', '#3a5a9a', '#9cc8f0')
