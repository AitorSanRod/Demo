import { POKEMON } from './pokemon'
import raw from './pokemon.json'
import type { PokeType } from './types'

interface BaseStats {
  hp: number
  atk: number
  def: number
  spe: number
}

interface Species {
  id: number
  name: string
  types: PokeType[]
  base: BaseStats
}

export const Rarity = { Common: 'common', Rare: 'rare', Epic: 'epic', Legendary: 'legendary' } as const
export type Rarity = (typeof Rarity)[keyof typeof Rarity]

interface RarityInfo {
  name: string
  color: string
  /** Probabilidad de que una pieza del gacha sea de esta rareza (las cuatro suman 1) */
  rate: number
  /** ₽ por combinar 5 piezas de un Pokémon que ya tiene las ★ al máximo */
  surplusMoney: number
}

export const RARITY_INFO: Record<Rarity, RarityInfo> = {
  [Rarity.Common]: { name: 'Común', color: '#888070', rate: 0.68, surplusMoney: 20 },
  [Rarity.Rare]: { name: 'Raro', color: '#1a6fbf', rate: 0.24, surplusMoney: 50 },
  [Rarity.Epic]: { name: 'Épico', color: '#a040a0', rate: 0.07, surplusMoney: 150 },
  [Rarity.Legendary]: { name: 'Legendario', color: '#e0a000', rate: 0.01, surplusMoney: 500 },
}

interface RawSpecies extends Omit<Species, 'base'> {
  base: BaseStats & { spa: number; spd: number }
}

/** PokeAPI da 6 stats y el juego usa 4: el ataque es el mayor entre físico y especial; la defensa, la media */
function simplifyStats(b: RawSpecies['base']): BaseStats {
  return { hp: b.hp, atk: Math.max(b.atk, b.spa), def: Math.round((b.def + b.spd) / 2), spe: b.spe }
}

export const SPECIES: Species[] = (raw as RawSpecies[]).map((s) => ({ ...s, base: simplifyStats(s.base) }))
const BY_ID = new Map(SPECIES.map((s) => [s.id, s]))

export function species(id: number): Species {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Especie desconocida: ${id}`)
  return s
}

function baseStatTotal(s: Species): number {
  const b = s.base
  return b.hp + b.atk + b.def + b.spe
}

/** Umbrales sobre el total de las 4 stats base (Mewtwo, el máximo, suma 480) */
export function rarityOf(s: Species): Rarity {
  const bst = baseStatTotal(s)
  if (bst >= 392) return Rarity.Legendary
  if (bst >= 335) return Rarity.Epic
  if (bst >= 275) return Rarity.Rare
  return Rarity.Common
}

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const sprite = {
  front: (id: number) => `${SPRITES}/${id}.png`,
  back: (id: number) => `${SPRITES}/back/${id}.png`,
  animated: (id: number) => `${SPRITES}/versions/generation-v/black-white/animated/${id}.gif`,
  animatedBack: (id: number) => `${SPRITES}/versions/generation-v/black-white/animated/back/${id}.gif`,
}

export const STARTERS: number[] = [POKEMON.Bulbasaur, POKEMON.Charmander, POKEMON.Squirtle]
