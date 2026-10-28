import raw from './pokemon.json'
import type { PokeType } from './types'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
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
  common: { name: 'Común', color: '#9e9e9e', rate: 0.68, dupeMoney: 20 },
  rare: { name: 'Raro', color: '#42a5f5', rate: 0.24, dupeMoney: 50 },
  epic: { name: 'Épico', color: '#ab47bc', rate: 0.07, dupeMoney: 150 },
  legendary: { name: 'Legendario', color: '#ffb300', rate: 0.01, dupeMoney: 500 },
}

export const SPECIES: Species[] = raw as Species[]
const BY_ID = new Map(SPECIES.map((s) => [s.id, s]))

export function species(id: number): Species {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Especie desconocida: ${id}`)
  return s
}

export function baseStatTotal(s: Species): number {
  const b = s.base
  return b.hp + b.atk + b.def + b.spa + b.spd + b.spe
}

export function rarityOf(s: Species): Rarity {
  const bst = baseStatTotal(s)
  if (bst >= 580) return 'legendary'
  if (bst >= 490) return 'epic'
  if (bst >= 400) return 'rare'
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
