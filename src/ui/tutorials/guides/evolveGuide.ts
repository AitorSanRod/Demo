import { PASSIVE_THRESHOLDS } from '../../../data/passives'
import { PIECES_PER_COMBINE } from '../../../game/collection/pieces'
import { MAX_STARS, STAR_BONUS } from '../../../game/team/stats'
import { formatPercent } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

const [PASSIVE_LEVEL_1, PASSIVE_LEVEL_2] = PASSIVE_THRESHOLDS

export const EVOLVE_GUIDE: Guide = {
  id: 'evolve',
  icon: ICON.Evolve,
  title: 'Evolucionar y mejorar',
  summary: 'Entrenar, evolucionar, estrellas y pasivas de rancho',
  steps: [
    {
      image: shot('evo-train'),
      title: 'Entrena',
      text: 'En la ficha, Cuidados › Entrenar: con − y + eliges cuántas sesiones y el arco de EXP marca en amarillo hasta dónde llegará. Pulsa el botón del centro para pagarlas con ₽.',
    },
    {
      image: shot('evo-evolve'),
      title: 'Evoluciona',
      text: 'Cuando llega al nivel de su evolución, en Evolución se activa el botón con su precio. Conserva el nivel y la EXP, pero pierde sus ★.',
    },
    {
      image: shot('evo-stones'),
      title: 'Piedras evolutivas',
      text: 'Algunos Pokémon evolucionan con una piedra, a cualquier nivel. Se compran en Tienda › Piedras evolutivas.',
    },
    {
      image: shot('evo-bag'),
      title: 'La Mochila',
      text: 'Lo que compras y aún no has usado (piedras y tipos de rancho) se guarda en Menú › Mochila, abajo a la derecha del rancho.',
    },
    {
      image: shot('evo-star'),
      title: 'Gana estrellas',
      text: `Con ${PIECES_PER_COMBINE} tickets de un Pokémon que ya tienes, «Combinar: +1 ★» le da una estrella: +${formatPercent(STAR_BONUS)} a todas sus stats, hasta ${MAX_STARS}.`,
    },
    {
      image: shot('evo-passives'),
      title: 'Pasivas de rancho',
      text: `Con ${PASSIVE_LEVEL_1} Pokémon de un tipo en el rancho de tu compañero, él gana en las rutas la pasiva de ese tipo; con ${PASSIVE_LEVEL_2}, el nivel 2. Se ven tocando el botón de arriba a la izquierda del rancho. Un tipo de rancho de la Tienda rebaja en uno los que hacen falta.`,
    },
  ],
}
