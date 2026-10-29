import { species } from './species'
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

const LIST: Move[] = [
  m('tackle', 'Placaje', 'normal', 40),
  m('scratch', 'Arañazo', 'normal', 40),
  m('quick-attack', 'Ataque Rápido', 'normal', 40),
  m('body-slam', 'Golpe Cuerpo', 'normal', 85),
  m('take-down', 'Derribo', 'normal', 90, 85),

  m('ember', 'Ascuas', 'fire', 40),
  m('flame-wheel', 'Rueda Fuego', 'fire', 60),
  m('flamethrower', 'Lanzallamas', 'fire', 90),
  m('water-gun', 'Pistola Agua', 'water', 40),
  m('water-pulse', 'Hidropulso', 'water', 60),
  m('surf', 'Surf', 'water', 90),
  m('thunder-shock', 'Impactrueno', 'electric', 40),
  m('spark', 'Chispa', 'electric', 65),
  m('thunderbolt', 'Rayo', 'electric', 90),
  m('vine-whip', 'Látigo Cepa', 'grass', 45),
  m('razor-leaf', 'Hoja Afilada', 'grass', 55, 95),
  m('energy-ball', 'Energibola', 'grass', 90),
  m('powder-snow', 'Nieve Polvo', 'ice', 40),
  m('icy-wind', 'Viento Hielo', 'ice', 55, 95),
  m('ice-beam', 'Rayo Hielo', 'ice', 90),
  m('karate-chop', 'Golpe Kárate', 'fighting', 50),
  m('low-sweep', 'Puntapié', 'fighting', 65),
  m('brick-break', 'Demolición', 'fighting', 75),
  m('acid', 'Ácido', 'poison', 40),
  m('sludge', 'Residuos', 'poison', 65),
  m('sludge-bomb', 'Bomba Lodo', 'poison', 90),
  m('mud-slap', 'Bofetón Lodo', 'ground', 35),
  m('mud-shot', 'Disparo Lodo', 'ground', 55, 95),
  m('earthquake', 'Terremoto', 'ground', 100),
  m('gust', 'Tornado', 'flying', 40),
  m('wing-attack', 'Ataque Ala', 'flying', 60),
  m('drill-peck', 'Pico Taladro', 'flying', 80),
  m('confusion', 'Confusión', 'psychic', 50),
  m('psybeam', 'Psicorrayo', 'psychic', 65),
  m('psychic', 'Psíquico', 'psychic', 90),
  m('fury-cutter', 'Corte Furia', 'bug', 40, 95),
  m('bug-bite', 'Picadura', 'bug', 60),
  m('x-scissor', 'Tijera X', 'bug', 80),
  m('rock-throw', 'Lanzarrocas', 'rock', 50, 90),
  m('rock-slide', 'Avalancha', 'rock', 75, 90),
  m('stone-edge', 'Roca Afilada', 'rock', 100, 80),
  m('lick', 'Lengüetazo', 'ghost', 30),
  m('hex', 'Infortunio', 'ghost', 65),
  m('shadow-ball', 'Bola Sombra', 'ghost', 80),
  m('twister', 'Ciclón', 'dragon', 40),
  m('dragon-breath', 'Dragoaliento', 'dragon', 60),
  m('dragon-claw', 'Garra Dragón', 'dragon', 80),
  m('bite', 'Mordisco', 'dark', 60),
  m('crunch', 'Triturar', 'dark', 80),
  m('metal-claw', 'Garra Metal', 'steel', 50, 95),
  m('iron-head', 'Cabeza de Hierro', 'steel', 80),
  m('fairy-wind', 'Viento Feérico', 'fairy', 40),
  m('draining-kiss', 'Beso Drenaje', 'fairy', 50),
  m('dazzling-gleam', 'Brillo Mágico', 'fairy', 80),
]

export const MOVES: Record<string, Move> = Object.fromEntries(LIST.map((mv) => [mv.id, mv]))

export function move(id: string): Move {
  const mv = MOVES[id]
  if (!mv) throw new Error(`Movimiento desconocido: ${id}`)
  return mv
}

// Movimientos por tipo en tres niveles de potencia (bajo, medio, alto)
const TIERS: Record<PokeType, [string, string, string]> = {
  normal: ['quick-attack', 'body-slam', 'take-down'],
  fire: ['ember', 'flame-wheel', 'flamethrower'],
  water: ['water-gun', 'water-pulse', 'surf'],
  electric: ['thunder-shock', 'spark', 'thunderbolt'],
  grass: ['vine-whip', 'razor-leaf', 'energy-ball'],
  ice: ['powder-snow', 'icy-wind', 'ice-beam'],
  fighting: ['karate-chop', 'low-sweep', 'brick-break'],
  poison: ['acid', 'sludge', 'sludge-bomb'],
  ground: ['mud-slap', 'mud-shot', 'earthquake'],
  flying: ['gust', 'wing-attack', 'drill-peck'],
  psychic: ['confusion', 'psybeam', 'psychic'],
  bug: ['fury-cutter', 'bug-bite', 'x-scissor'],
  rock: ['rock-throw', 'rock-slide', 'stone-edge'],
  ghost: ['lick', 'hex', 'shadow-ball'],
  dragon: ['twister', 'dragon-breath', 'dragon-claw'],
  dark: ['bite', 'bite', 'crunch'],
  steel: ['metal-claw', 'metal-claw', 'iron-head'],
  fairy: ['fairy-wind', 'draining-kiss', 'dazzling-gleam'],
}

export interface LearnEntry {
  level: number
  moveId: string
}

/** Aprendizaje generado a partir de los tipos de la especie (determinista). */
export function learnset(speciesId: number): LearnEntry[] {
  const [primary, secondary] = species(speciesId).types
  const entries: LearnEntry[] = [
    { level: 1, moveId: speciesId % 2 === 0 ? 'scratch' : 'tackle' },
    { level: 4, moveId: TIERS[primary][0] },
    { level: 9, moveId: secondary ? TIERS[secondary][0] : 'quick-attack' },
    { level: 14, moveId: TIERS[primary][1] },
    { level: 20, moveId: secondary ? TIERS[secondary][1] : 'body-slam' },
    { level: 28, moveId: TIERS[primary][2] },
    { level: 36, moveId: secondary ? TIERS[secondary][2] : 'take-down' },
  ]
  const seen = new Set<string>()
  return entries.filter((e) => !seen.has(e.moveId) && seen.add(e.moveId))
}

export function knownMoves(speciesId: number, level: number): string[] {
  return learnset(speciesId)
    .filter((e) => e.level <= level)
    .map((e) => e.moveId)
}

/** Los 4 últimos movimientos aprendidos: el repertorio de un Pokémon salvaje. */
export function wildMoves(speciesId: number, level: number): string[] {
  return knownMoves(speciesId, level).slice(-4)
}

/** El de más potencia; en empate, el último de la lista (el aprendido más tarde, que suele ser de su tipo) */
export function strongestMove(ids: string[]): string {
  return ids.reduce((best, id) => (move(id).power >= move(best).power ? id : best))
}
