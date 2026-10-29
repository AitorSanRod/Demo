import raw from './pokemon.json'
import type { PokeType } from './types'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spe: number
}

export interface Species {
  id: number
  name: string
  types: PokeType[]
  base: BaseStats
  baseExp: number
  captureRate: number
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY_INFO: Record<Rarity, { name: string; color: string; rate: number; dupeMoney: number }> = {
  common: { name: 'Común', color: '#888070', rate: 0.68, dupeMoney: 20 },
  rare: { name: 'Raro', color: '#1a6fbf', rate: 0.24, dupeMoney: 50 },
  epic: { name: 'Épico', color: '#a040a0', rate: 0.07, dupeMoney: 150 },
  legendary: { name: 'Legendario', color: '#e0a000', rate: 0.01, dupeMoney: 500 },
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
const BY_NAME = new Map(SPECIES.map((s) => [s.name, s]))

export function species(id: number): Species {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Especie desconocida: ${id}`)
  return s
}

/** Busca una especie por su nombre exacto, como aparece en pokemon.json (p. ej. "Nidoran♀") */
export function speciesByName(name: string): Species {
  const s = BY_NAME.get(name)
  if (!s) throw new Error(`Especie desconocida: ${name}`)
  return s
}

export function baseStatTotal(s: Species): number {
  const b = s.base
  return b.hp + b.atk + b.def + b.spe
}

/** Umbrales sobre el total de las 4 stats base (Mewtwo, el máximo, suma 480) */
export function rarityOf(s: Species): Rarity {
  const bst = baseStatTotal(s)
  if (bst >= 392) return 'legendary'
  if (bst >= 335) return 'epic'
  if (bst >= 275) return 'rare'
  return 'common'
}

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const sprite = {
  front: (id: number) => `${SPRITES}/${id}.png`,
  back: (id: number) => `${SPRITES}/back/${id}.png`,
  animated: (id: number) => `${SPRITES}/versions/generation-v/black-white/animated/${id}.gif`,
  animatedBack: (id: number) => `${SPRITES}/versions/generation-v/black-white/animated/back/${id}.gif`,
}

export const STARTERS = [1, 4, 7]
