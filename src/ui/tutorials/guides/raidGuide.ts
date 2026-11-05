import { RAID_REVIVE_MS } from '../../../game/raid/raidCombat'
import { RAID_MIN_PRESENCE } from '../../../game/raid/raidPrizes'
import { formatMinutes, formatPercent } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const RAID_GUIDE: Guide = {
  id: 'raids',
  icon: ICON.Raid,
  title: 'Raids',
  summary: 'Luchar en grupo contra los jefes comunitarios',
  steps: [
    {
      image: shot('raid-tab'),
      title: 'Entra en Raids',
      text: 'En la pestaña Ruta, toca el icono de arriba a la derecha. Ahí está el jefe comunitario: un Pokémon enorme contra el que se lucha en grupo con otros jugadores.',
    },
    {
      image: shot('raid-join'),
      title: 'Elige quién lucha',
      text: 'Abajo, en «Tu Pokémon», toca al que quieras mandar. Tiene que estar en el rancho y algunos jefes piden un nivel mínimo.',
    },
    {
      image: shot('raid-send'),
      title: 'Mándalo a la sala',
      text: 'Pulsa «Mandar a…». Lucha él solo, también con la app cerrada, y no te quita el hueco de expedición ni bloquea a tu compañero de ruta.',
    },
    {
      image: shot('raid-nickname'),
      title: 'Tu apodo',
      text: 'La primera vez eliges el apodo con el que te verán los demás jugadores de la sala. Puedes cambiarlo en Ajustes.',
    },
    {
      image: shot('raid-battle'),
      title: 'La pelea',
      text: `Tu Pokémon lleva «Tú» a los pies y su línea de la sala sale marcada. Bajo la vida del jefe ves cuánto tardará en caer. Si lo debilitan, vuelve a los ${formatMinutes(RAID_REVIVE_MS / 60_000)} con todos sus PS.`,
    },
    {
      image: shot('raid-prize'),
      title: 'Recoge el premio',
      text: `Al caer el jefe cobra quien haya estado al menos el ${formatPercent(RAID_MIN_PRESENCE)} de la pelea o siga dentro. El premio se recoge en este botón. Algunas rutas también tienen un jefe en una de sus paradas: se lucha igual, sin salir de la ruta.`,
    },
  ],
}
