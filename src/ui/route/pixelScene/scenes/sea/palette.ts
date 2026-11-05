// Colores del mar (ruta marina): el cielo del prado, agua más clara cuanto más lejos, espuma blanca, islotes de
// arena con palmeras y rocas grises. Cada rampa va de oscuro a claro.

import { hex, palette } from '../../paint/pixmap'

/** Agua por distancias: [sombra, base, luz] de cada franja, de la más lejana a la más cercana */
export const FAR_WATER = palette('#6cbcec', '#84ccf2', '#a8dcf6')
export const MID_WATER = palette('#3e9ae2', '#4ea8e8', '#7cc4f2')
export const NEAR_WATER = palette('#2474c8', '#2e84d4', '#4a9ce0', '#8acef6')
/** Espuma de las olas: sombra y blanco */
export const FOAM = palette('#c4e4f8', '#ffffff')

/** Arena de los islotes: sombra, base y luz */
export const SAND = palette('#d8b870', '#ecd290', '#f8e6b4')
/** Copa de las palmeras: hueco, sombra, base, luz y brillo */
export const PALM = { colors: palette('#1c5e2c', '#287634', '#3a903e', '#58aa48', '#7cc458'), ink: hex('#164a24') }
export const PALM_TRUNK = palette('#6e4222', '#93592c', '#c27e3e')
/** Hierba de lo alto de los islotes: sombra, base y luz */
export const ISLE_GRASS = palette('#3c9a32', '#58b83a', '#78cc44')
/** Rocas del mar: hueco, sombra, base, luz y brillo */
export const SEA_ROCK = { colors: palette('#3e4858', '#56606e', '#6e7a88', '#8c98a2', '#aab4bc'), ink: hex('#2c3440') }
