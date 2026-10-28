import { species } from './species'
import type { PokeType } from './types'

export type StatKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe'

export interface Move {
  id: string
  name: string
  type: PokeType
  category: 'physical' | 'special' | 'status'
  power: number
  accuracy: number
  effect?: { target: 'self' | 'foe'; stat: StatKey; stages: number }
}

const m = (
  id: string,
  name: string,
  type: PokeType,
  category: Move['category'],
  power: number,
  accuracy = 100,
  effect?: Move['effect'],
): Move => ({ id, name, type, category, power, accuracy, effect })

const LIST: Move[] = [
  m('tackle', 'Placaje', 'normal', 'physical', 40),
  m('scratch', 'Arañazo', 'normal', 'physical', 40),
  m('quick-attack', 'Ataque Rápido', 'normal', 'physical', 40),
  m('body-slam', 'Golpe Cuerpo', 'normal', 'physical', 85),
  m('take-down', 'Derribo', 'normal', 'physical', 90, 85),
  m('growl', 'Gruñido', 'normal', 'status', 0, 100, { target: 'foe', stat: 'atk', stages: -1 }),
  m('leer', 'Malicioso', 'normal', 'status', 0, 100, { target: 'foe', stat: 'def', stages: -1 }),
  m('defense-curl', 'Rizo Defensa', 'normal', 'status', 0, 100, { target: 'self', stat: 'def', stages: 1 }),

  m('ember', 'Ascuas', 'fire', 'special', 40),
  m('flame-wheel', 'Rueda Fuego', 'fire', 'physical', 60),
  m('flamethrower', 'Lanzallamas', 'fire', 'special', 90),
  m('water-gun', 'Pistola Agua', 'water', 'special', 40),
  m('water-pulse', 'Hidropulso', 'water', 'special', 60),
  m('surf', 'Surf', 'water', 'special', 90),
  m('thunder-shock', 'Impactrueno', 'electric', 'special', 40),
  m('spark', 'Chispa', 'electric', 'physical', 65),
  m('thunderbolt', 'Rayo', 'electric', 'special', 90),
  m('vine-whip', 'Látigo Cepa', 'grass', 'physical', 45),
  m('razor-leaf', 'Hoja Afilada', 'grass', 'physical', 55, 95),
  m('energy-ball', 'Energibola', 'grass', 'special', 90),
  m('powder-snow', 'Nieve Polvo', 'ice', 'special', 40),
  m('icy-wind', 'Viento Hielo', 'ice', 'special', 55, 95),
  m('ice-beam', 'Rayo Hielo', 'ice', 'special', 90),
  m('karate-chop', 'Golpe Kárate', 'fighting', 'physical', 50),
  m('low-sweep', 'Puntapié', 'fighting', 'physical', 65),
  m('brick-break', 'Demolición', 'fighting', 'physical', 75),
  m('acid', 'Ácido', 'poison', 'special', 40),
  m('sludge', 'Residuos', 'poison', 'special', 65),
  m('sludge-bomb', 'Bomba Lodo', 'poison', 'special', 90),
  m('mud-slap', 'Bofetón Lodo', 'ground', 'special', 35),
  m('mud-shot', 'Disparo Lodo', 'ground', 'special', 55, 95),
  m('earthquake', 'Terremoto', 'ground', 'physical', 100),
  m('gust', 'Tornado', 'flying', 'special', 40),
  m('wing-attack', 'Ataque Ala', 'flying', 'physical', 60),
  m('drill-peck', 'Pico Taladro', 'flying', 'physical', 80),
  m('confusion', 'Confusión', 'psychic', 'special', 50),
  m('psybeam', 'Psicorrayo', 'psychic', 'special', 65),
  m('psychic', 'Psíquico', 'psychic', 'special', 90),
  m('string-shot', 'Disparo Demora', 'bug', 'status', 0, 95, { target: 'foe', stat: 'spe', stages: -1 }),
  m('bug-bite', 'Picadura', 'bug', 'physical', 60),
  m('x-scissor', 'Tijera X', 'bug', 'physical', 80),
  m('rock-throw', 'Lanzarrocas', 'rock', 'physical', 50, 90),
  m('rock-slide', 'Avalancha', 'rock', 'physical', 75, 90),
  m('stone-edge', 'Roca Afilada', 'rock', 'physical', 100, 80),
  m('lick', 'Lengüetazo', 'ghost', 'physical', 30),
  m('hex', 'Infortunio', 'ghost', 'special', 65),
  m('shadow-ball', 'Bola Sombra', 'ghost', 'special', 80),
  m('twister', 'Ciclón', 'dragon', 'special', 40),
  m('dragon-breath', 'Dragoaliento', 'dragon', 'special', 60),
  m('dragon-claw', 'Garra Dragón', 'dragon', 'physical', 80),
  m('bite', 'Mordisco', 'dark', 'physical', 60),
  m('crunch', 'Triturar', 'dark', 'physical', 80),
  m('metal-claw', 'Garra Metal', 'steel', 'physical', 50, 95),
  m('iron-head', 'Cabeza de Hierro', 'steel', 'physical', 80),
  m('fairy-wind', 'Viento Feérico', 'fairy', 'special', 40),
  m('draining-kiss', 'Beso Drenaje', 'fairy', 'special', 50),
  m('dazzling-gleam', 'Brillo Mágico', 'fairy', 'special', 80),
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
  bug: ['string-shot', 'bug-bite', 'x-scissor'],
  rock: ['rock-throw', 'rock-slide', 'stone-edge'],
  ghost: ['lick', 'hex', 'shadow-ball'],
  dragon: ['twister', 'dragon-breath', 'dragon-claw'],
  dark: ['bite', 'bite', 'crunch'],
  steel: ['metal-claw', 'metal-claw', 'iron-head'],
  fairy: ['fairy-wind', 'draining-kiss', 'dazzling-gleam'],
}

const STATUS_MOVES = ['growl', 'leer', 'defense-curl']

export interface LearnEntry {
  level: number
  moveId: string
}

/** Aprendizaje generado a partir de los tipos de la especie (determinista). */
export function learnset(speciesId: number): LearnEntry[] {
  const [primary, secondary] = species(speciesId).types
  const entries: LearnEntry[] = [
    { level: 1, moveId: speciesId % 2 === 0 ? 'scratch' : 'tackle' },
    { level: 1, moveId: STATUS_MOVES[speciesId % STATUS_MOVES.length] },
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

/** Los 4 últimos movimientos aprendidos: lo que usaría un Pokémon salvaje. */
export function defaultMoves(speciesId: number, level: number): string[] {
  return knownMoves(speciesId, level).slice(-4)
}
