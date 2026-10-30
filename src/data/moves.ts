import { rarityOf, species, type Rarity } from './species'
import type { PokeType } from './types'

/** Todos los movimientos son de daño: usan el ataque del Pokémon contra la defensa del rival */
export interface Move {
  id: string
  name: string
  type: PokeType
  power: number
  accuracy: number
}

const m = (id: string, name: string, type: PokeType, power: number, accuracy = 100): Move => ({
  id,
  name,
  type,
  power,
  accuracy,
})

/**
 * Cada Pokémon tiene un único ataque: el de su primer tipo y el escalón de su rareza. La potencia crece con la rareza
 * (≈40 común, ≈85 raro, ≈105 épico, 120 legendario), así que los raros pegan bastante más que los comunes.
 */
const BY_TYPE: Record<PokeType, Record<Rarity, Move>> = {
  normal: {
    common: m('tackle', 'Placaje', 'normal', 40),
    rare: m('body-slam', 'Golpe Cuerpo', 'normal', 85),
    epic: m('double-edge', 'Doble Filo', 'normal', 110),
    legendary: m('hyper-beam', 'Hiperrayo', 'normal', 120, 90),
  },
  fire: {
    common: m('ember', 'Ascuas', 'fire', 40),
    rare: m('flamethrower', 'Lanzallamas', 'fire', 90),
    epic: m('fire-blast', 'Llamarada', 'fire', 110, 85),
    legendary: m('overheat', 'Sofoco', 'fire', 120, 90),
  },
  water: {
    common: m('water-gun', 'Pistola Agua', 'water', 40),
    rare: m('surf', 'Surf', 'water', 90),
    epic: m('hydro-pump', 'Hidrobomba', 'water', 110, 80),
    legendary: m('hydro-cannon', 'Hidrocañón', 'water', 120, 90),
  },
  electric: {
    common: m('thunder-shock', 'Impactrueno', 'electric', 40),
    rare: m('thunderbolt', 'Rayo', 'electric', 90),
    epic: m('thunder', 'Trueno', 'electric', 110, 70),
    legendary: m('volt-tackle', 'Placaje Eléctrico', 'electric', 120),
  },
  grass: {
    common: m('vine-whip', 'Látigo Cepa', 'grass', 45),
    rare: m('energy-ball', 'Energibola', 'grass', 90),
    epic: m('solar-beam', 'Rayo Solar', 'grass', 110),
    legendary: m('frenzy-plant', 'Planta Feroz', 'grass', 120, 90),
  },
  ice: {
    common: m('powder-snow', 'Nieve Polvo', 'ice', 40),
    rare: m('ice-beam', 'Rayo Hielo', 'ice', 90),
    epic: m('blizzard', 'Ventisca', 'ice', 110, 70),
    legendary: m('freeze-shock', 'Rayo Gélido', 'ice', 120, 90),
  },
  fighting: {
    common: m('karate-chop', 'Golpe Kárate', 'fighting', 50),
    rare: m('aura-sphere', 'Esfera Aural', 'fighting', 80),
    epic: m('focus-blast', 'Onda Certera', 'fighting', 110, 70),
    legendary: m('close-combat', 'A Bocajarro', 'fighting', 120),
  },
  poison: {
    common: m('acid', 'Ácido', 'poison', 40),
    rare: m('sludge-bomb', 'Bomba Lodo', 'poison', 90),
    epic: m('sludge-wave', 'Onda Tóxica', 'poison', 95),
    legendary: m('gunk-shot', 'Lanzamugre', 'poison', 120, 80),
  },
  ground: {
    common: m('mud-slap', 'Bofetón Lodo', 'ground', 40),
    rare: m('earth-power', 'Tierra Viva', 'ground', 90),
    epic: m('earthquake', 'Terremoto', 'ground', 100),
    legendary: m('precipice-blades', 'Filo del Abismo', 'ground', 120, 85),
  },
  flying: {
    common: m('gust', 'Tornado', 'flying', 40),
    rare: m('fly', 'Vuelo', 'flying', 90, 95),
    epic: m('hurricane', 'Vendaval', 'flying', 110, 70),
    legendary: m('sky-attack', 'Ataque Aéreo', 'flying', 120, 90),
  },
  psychic: {
    common: m('confusion', 'Confusión', 'psychic', 50),
    rare: m('psychic', 'Psíquico', 'psychic', 90),
    epic: m('psystrike', 'Onda Mental', 'psychic', 100),
    legendary: m('psycho-boost', 'Psicoataque', 'psychic', 120, 90),
  },
  bug: {
    common: m('fury-cutter', 'Corte Furia', 'bug', 40, 95),
    rare: m('x-scissor', 'Tijera X', 'bug', 80),
    epic: m('bug-buzz', 'Zumbido', 'bug', 90),
    legendary: m('megahorn', 'Megacuerno', 'bug', 120, 85),
  },
  rock: {
    common: m('rock-throw', 'Lanzarrocas', 'rock', 50, 90),
    rare: m('rock-slide', 'Avalancha', 'rock', 75, 90),
    epic: m('stone-edge', 'Roca Afilada', 'rock', 100, 80),
    legendary: m('head-smash', 'Testarazo', 'rock', 120, 80),
  },
  ghost: {
    common: m('shadow-sneak', 'Sombra Vil', 'ghost', 40),
    rare: m('shadow-ball', 'Bola Sombra', 'ghost', 80),
    epic: m('phantom-force', 'Golpe Fantasma', 'ghost', 90),
    legendary: m('shadow-force', 'Golpe Umbrío', 'ghost', 120),
  },
  dragon: {
    common: m('twister', 'Ciclón', 'dragon', 40),
    rare: m('dragon-claw', 'Garra Dragón', 'dragon', 80),
    epic: m('dragon-pulse', 'Pulso Dragón', 'dragon', 85),
    legendary: m('outrage', 'Enfado', 'dragon', 120),
  },
  dark: {
    common: m('bite', 'Mordisco', 'dark', 60),
    rare: m('crunch', 'Triturar', 'dark', 80),
    epic: m('night-daze', 'Pulso Noche', 'dark', 85, 95),
    legendary: m('foul-play', 'Juego Sucio', 'dark', 95),
  },
  steel: {
    common: m('metal-claw', 'Garra Metal', 'steel', 50, 95),
    rare: m('iron-head', 'Cabeza de Hierro', 'steel', 80),
    epic: m('flash-cannon', 'Foco Resplandor', 'steel', 90),
    legendary: m('iron-tail', 'Cola Férrea', 'steel', 100, 75),
  },
  fairy: {
    common: m('fairy-wind', 'Viento Feérico', 'fairy', 40),
    rare: m('dazzling-gleam', 'Brillo Mágico', 'fairy', 80),
    epic: m('moonblast', 'Fuerza Lunar', 'fairy', 95),
    legendary: m('light-of-ruin', 'Luz Aniquiladora', 'fairy', 120, 90),
  },
}

export const MOVES: Record<string, Move> = Object.fromEntries(
  Object.values(BY_TYPE).flatMap((tiers) => Object.values(tiers).map((mv) => [mv.id, mv])),
)

export function move(id: string): Move {
  const mv = MOVES[id]
  if (!mv) throw new Error(`Movimiento desconocido: ${id}`)
  return mv
}

/** El único ataque de una especie: el de su primer tipo y su rareza. No se elige ni cambia con el nivel. */
export function signatureMove(speciesId: number): Move {
  const sp = species(speciesId)
  return BY_TYPE[sp.types[0]][rarityOf(sp)]
}
