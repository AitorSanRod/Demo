import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const MONEY_GUIDE: Guide = {
  id: 'money',
  icon: ICON.Money,
  title: 'Ganar dinero',
  summary: 'Rutas, expediciones, raids y el obsequio diario',
  steps: [
    {
      image: shot('money-run'),
      title: 'Gana combates en ruta',
      text: 'Cada victoria da ₽ (salen en amarillo sobre el rival) según los pasos andados y el nivel del rival: las rutas más altas pagan más. Lo ganado se suma arriba, junto a tus ₽.',
    },
    {
      image: shot('money-routes'),
      title: 'Completa rutas nuevas',
      text: 'La primera vez que completas una ruta te llevas su premio y desbloqueas la siguiente. Si te derrotan pierdes parte de lo ganado en ella, así que elige rutas a tu nivel.',
    },
    {
      image: shot('money-expedition'),
      title: 'Expediciones largas',
      text: 'Cuanto más larga es una expedición, más multiplica los premios (lo ves debajo de la duración). Compra más huecos en la Tienda para mandar a varios a la vez.',
    },
    {
      image: shot('raid-prize'),
      title: 'Derrota jefes comunitarios',
      text: 'Los premios de las raids traen ₽, tickets y EXP. El jefe de una parada de ruta da menos dinero si lo repites seguido; descansa un rato y vuelve a darlo entero.',
    },
    {
      image: shot('money-gift'),
      title: 'Obsequio diario',
      text: 'Con una cuenta, cada 24 horas tienes un regalo en Menú › Obsequio diario: ₽, trozos de MissingNo y tickets, en ciclo.',
    },
  ],
}
