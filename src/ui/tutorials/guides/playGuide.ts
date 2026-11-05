import { PIECES_PER_COMBINE } from '../../../game/collection/pieces'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const PLAY_GUIDE: Guide = {
  id: 'play',
  icon: ICON.Route,
  title: 'Cómo jugar',
  summary: 'El rancho, las rutas, las expediciones y conseguir Pokémon',
  steps: [
    {
      image: shot('play-ranch'),
      title: 'Tu rancho',
      text: 'Aquí viven tus Pokémon. Toca cualquiera para abrir su ficha. Arrastrándolo lo cambias de sitio y, si lo sueltas sobre la Caja (abajo a la izquierda), lo guardas.',
    },
    {
      image: shot('play-companion'),
      title: 'Elige a tu compañero',
      text: 'En la ficha, la Poké Ball de arriba a la izquierda lo hace tu compañero de viaje: es el que sale a las rutas. Solo se cambia desde el rancho y sin una ruta en curso.',
    },
    {
      image: shot('play-routes'),
      title: 'Elige una ruta',
      text: 'En la pestaña Ruta está el mapa. Cada línea dice el nivel de sus Pokémon y la ✓ marca las que ya completaste. Toca «Comenzar» en la que quieras.',
    },
    {
      image: shot('play-start'),
      title: 'Sal de ruta',
      text: 'Mira quién puede aparecer (los que aún no has visto salen como ?) y pulsa «¡En marcha!». A partir de aquí todo es automático.',
    },
    {
      image: shot('play-run'),
      title: 'Combate solo',
      text: 'Tu Pokémon camina de parada en parada y combate él solo. Toca la pantalla para dar pasos más rápido o acelerar el combate. Ganar no cura: si cae, la ruta acaba y pierdes parte del dinero ganado en ella.',
    },
    {
      image: shot('play-expeditions'),
      title: 'Manda al resto de expedición',
      text: 'Arriba, el icono de la bicicleta abre Expediciones: elige una ruta, quién va y cuánto tiempo. Vuelven con EXP, dinero, tickets y a veces Pokémon nuevos, sin riesgo.',
    },
    {
      image: shot('play-gacha'),
      title: 'Abre Poké Balls',
      text: 'En Gacha, cada ticket de gacha abre una Poké Ball con tickets de Pokémon al azar. Si te faltan, cómpralos con ₽ justo debajo.',
    },
    {
      image: shot('play-dex'),
      title: 'Crea Pokémon en la Pokédex',
      text: `Con ${PIECES_PER_COMBINE} tickets de un Pokémon que ya hayas visto, créalo en la Pokédex. Las casillas que brillan están listas: «¡Crear!» o «+1 ★» si ya lo tienes.`,
    },
  ],
}
