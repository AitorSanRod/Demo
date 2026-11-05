import { Biome } from '../../../data/maps'
import type { PokeType } from '../../../data/types'
import beach from '../../../assets/scenery/beach.png'
import beachshore from '../../../assets/scenery/beachshore.png'
import city from '../../../assets/scenery/city.png'
import dampcave from '../../../assets/scenery/dampcave.png'
import deepsea from '../../../assets/scenery/deepsea.png'
import desert from '../../../assets/scenery/desert.png'
import earthycave from '../../../assets/scenery/earthycave.png'
import forest from '../../../assets/scenery/forest.png'
import icecave from '../../../assets/scenery/icecave.png'
import meadow from '../../../assets/scenery/meadow.png'
import mountain from '../../../assets/scenery/mountain.png'
import river from '../../../assets/scenery/river.png'
import route from '../../../assets/scenery/route.png'
import thunderplains from '../../../assets/scenery/thunderplains.png'
import volcanocave from '../../../assets/scenery/volcanocave.png'

/** Fondo de la ficha según el primer tipo del Pokémon (fondos de combate de Pokémon Showdown, ver docs/diseno.md) */
export const TYPE_SCENERY: Record<PokeType, string> = {
  normal: route,
  fire: volcanocave,
  water: beach,
  electric: thunderplains,
  grass: meadow,
  ice: icecave,
  fighting: mountain,
  poison: dampcave,
  ground: desert,
  flying: beachshore,
  psychic: city,
  bug: forest,
  rock: earthycave,
  ghost: deepsea,
  dragon: river,
  dark: deepsea,
  steel: city,
  fairy: river,
}

/** Fondo de la cabecera de una ruta según su bioma (los mismos fondos de combate) */
export const BIOME_SCENERY: Record<Biome, string> = {
  [Biome.Meadow]: meadow,
  [Biome.PalletTown]: meadow,
  [Biome.PewterCity]: city,
  [Biome.Forest]: forest,
  [Biome.Cave]: earthycave,
  [Biome.Sea]: beach,
}
