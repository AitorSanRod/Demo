import { POKEMON } from './pokemon'
import { Stone } from './stones'

/** Cómo se llega a una evolución: al alcanzar un nivel o gastando una piedra (a cualquier nivel) */
export type Evolution = { into: number; level: number; stone?: undefined } | { into: number; stone: Stone; level?: undefined }

const atLevel = (into: number, level: number): Evolution => ({ into, level })
const withStone = (into: number, stone: Stone): Evolution => ({ into, stone })

/**
 * Evoluciones de la 1ª generación: especie → sus evoluciones. Solo las que llevan a otra de las 151 (sin Crobat,
 * Steelix, Scizor…). Niveles de los juegos; las de intercambio (Alakazam, Machamp, Golem, Gengar) llevan uno propio.
 * Eevee es la única con varias opciones; el jugador elige.
 */
const EVOLUTIONS: Record<number, Evolution[]> = {
  [POKEMON.Bulbasaur]: [atLevel(POKEMON.Ivysaur, 16)],
  [POKEMON.Ivysaur]: [atLevel(POKEMON.Venusaur, 32)],
  [POKEMON.Charmander]: [atLevel(POKEMON.Charmeleon, 16)],
  [POKEMON.Charmeleon]: [atLevel(POKEMON.Charizard, 36)],
  [POKEMON.Squirtle]: [atLevel(POKEMON.Wartortle, 16)],
  [POKEMON.Wartortle]: [atLevel(POKEMON.Blastoise, 36)],
  [POKEMON.Caterpie]: [atLevel(POKEMON.Metapod, 7)],
  [POKEMON.Metapod]: [atLevel(POKEMON.Butterfree, 10)],
  [POKEMON.Weedle]: [atLevel(POKEMON.Kakuna, 7)],
  [POKEMON.Kakuna]: [atLevel(POKEMON.Beedrill, 10)],
  [POKEMON.Pidgey]: [atLevel(POKEMON.Pidgeotto, 18)],
  [POKEMON.Pidgeotto]: [atLevel(POKEMON.Pidgeot, 36)],
  [POKEMON.Rattata]: [atLevel(POKEMON.Raticate, 20)],
  [POKEMON.Spearow]: [atLevel(POKEMON.Fearow, 20)],
  [POKEMON.Ekans]: [atLevel(POKEMON.Arbok, 22)],
  [POKEMON.Pikachu]: [withStone(POKEMON.Raichu, Stone.Thunder)],
  [POKEMON.Sandshrew]: [atLevel(POKEMON.Sandslash, 22)],
  [POKEMON.NidoranF]: [atLevel(POKEMON.Nidorina, 16)],
  [POKEMON.Nidorina]: [withStone(POKEMON.Nidoqueen, Stone.Moon)],
  [POKEMON.NidoranM]: [atLevel(POKEMON.Nidorino, 16)],
  [POKEMON.Nidorino]: [withStone(POKEMON.Nidoking, Stone.Moon)],
  [POKEMON.Clefairy]: [withStone(POKEMON.Clefable, Stone.Moon)],
  [POKEMON.Vulpix]: [withStone(POKEMON.Ninetales, Stone.Fire)],
  [POKEMON.Jigglypuff]: [withStone(POKEMON.Wigglytuff, Stone.Moon)],
  [POKEMON.Zubat]: [atLevel(POKEMON.Golbat, 22)],
  [POKEMON.Oddish]: [atLevel(POKEMON.Gloom, 21)],
  [POKEMON.Gloom]: [withStone(POKEMON.Vileplume, Stone.Leaf)],
  [POKEMON.Paras]: [atLevel(POKEMON.Parasect, 24)],
  [POKEMON.Venonat]: [atLevel(POKEMON.Venomoth, 31)],
  [POKEMON.Diglett]: [atLevel(POKEMON.Dugtrio, 26)],
  [POKEMON.Meowth]: [atLevel(POKEMON.Persian, 28)],
  [POKEMON.Psyduck]: [atLevel(POKEMON.Golduck, 33)],
  [POKEMON.Mankey]: [atLevel(POKEMON.Primeape, 28)],
  [POKEMON.Growlithe]: [withStone(POKEMON.Arcanine, Stone.Fire)],
  [POKEMON.Poliwag]: [atLevel(POKEMON.Poliwhirl, 25)],
  [POKEMON.Poliwhirl]: [withStone(POKEMON.Poliwrath, Stone.Water)],
  [POKEMON.Abra]: [atLevel(POKEMON.Kadabra, 16)],
  [POKEMON.Kadabra]: [atLevel(POKEMON.Alakazam, 36)],
  [POKEMON.Machop]: [atLevel(POKEMON.Machoke, 28)],
  [POKEMON.Machoke]: [atLevel(POKEMON.Machamp, 40)],
  [POKEMON.Bellsprout]: [atLevel(POKEMON.Weepinbell, 21)],
  [POKEMON.Weepinbell]: [withStone(POKEMON.Victreebel, Stone.Leaf)],
  [POKEMON.Tentacool]: [atLevel(POKEMON.Tentacruel, 30)],
  [POKEMON.Geodude]: [atLevel(POKEMON.Graveler, 25)],
  [POKEMON.Graveler]: [atLevel(POKEMON.Golem, 40)],
  [POKEMON.Ponyta]: [atLevel(POKEMON.Rapidash, 40)],
  [POKEMON.Slowpoke]: [atLevel(POKEMON.Slowbro, 37)],
  [POKEMON.Magnemite]: [atLevel(POKEMON.Magneton, 30)],
  [POKEMON.Doduo]: [atLevel(POKEMON.Dodrio, 31)],
  [POKEMON.Seel]: [atLevel(POKEMON.Dewgong, 34)],
  [POKEMON.Grimer]: [atLevel(POKEMON.Muk, 38)],
  [POKEMON.Shellder]: [withStone(POKEMON.Cloyster, Stone.Water)],
  [POKEMON.Gastly]: [atLevel(POKEMON.Haunter, 25)],
  [POKEMON.Haunter]: [atLevel(POKEMON.Gengar, 38)],
  [POKEMON.Drowzee]: [atLevel(POKEMON.Hypno, 26)],
  [POKEMON.Krabby]: [atLevel(POKEMON.Kingler, 28)],
  [POKEMON.Voltorb]: [atLevel(POKEMON.Electrode, 30)],
  [POKEMON.Exeggcute]: [withStone(POKEMON.Exeggutor, Stone.Leaf)],
  [POKEMON.Cubone]: [atLevel(POKEMON.Marowak, 28)],
  [POKEMON.Koffing]: [atLevel(POKEMON.Weezing, 35)],
  [POKEMON.Rhyhorn]: [atLevel(POKEMON.Rhydon, 42)],
  [POKEMON.Horsea]: [atLevel(POKEMON.Seadra, 32)],
  [POKEMON.Goldeen]: [atLevel(POKEMON.Seaking, 33)],
  [POKEMON.Staryu]: [withStone(POKEMON.Starmie, Stone.Water)],
  [POKEMON.Magikarp]: [atLevel(POKEMON.Gyarados, 20)],
  [POKEMON.Eevee]: [withStone(POKEMON.Vaporeon, Stone.Water), withStone(POKEMON.Jolteon, Stone.Thunder), withStone(POKEMON.Flareon, Stone.Fire)],
  [POKEMON.Omanyte]: [atLevel(POKEMON.Omastar, 40)],
  [POKEMON.Kabuto]: [atLevel(POKEMON.Kabutops, 40)],
  [POKEMON.Dratini]: [atLevel(POKEMON.Dragonair, 30)],
  [POKEMON.Dragonair]: [atLevel(POKEMON.Dragonite, 55)],
}

/** Evoluciones de la especie (vacío si no evoluciona) */
export const evolutionsOf = (speciesId: number): Evolution[] => EVOLUTIONS[speciesId] ?? []

/** La evolución de `speciesId` a `intoId`, si existe */
export const evolutionTo = (speciesId: number, intoId: number): Evolution | undefined => evolutionsOf(speciesId).find((e) => e.into === intoId)

export const EVOLVING_SPECIES = Object.keys(EVOLUTIONS).map(Number)
