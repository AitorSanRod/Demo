import { ITEM, type Item } from './items'

/** Piedras evolutivas de la 1ª generación: se compran en la tienda y se gastan al evolucionar */
export const Stone = { Fire: 'fire', Water: 'water', Thunder: 'thunder', Leaf: 'leaf', Moon: 'moon' } as const
export type Stone = (typeof Stone)[keyof typeof Stone]

interface StoneInfo {
  name: string
  item: Item
}

export const STONES: Record<Stone, StoneInfo> = {
  [Stone.Fire]: { name: 'Piedra Fuego', item: ITEM.FireStone },
  [Stone.Water]: { name: 'Piedra Agua', item: ITEM.WaterStone },
  [Stone.Thunder]: { name: 'Piedra Trueno', item: ITEM.ThunderStone },
  [Stone.Leaf]: { name: 'Piedra Hoja', item: ITEM.LeafStone },
  [Stone.Moon]: { name: 'Piedra Lunar', item: ITEM.MoonStone },
}

export const STONE_IDS = Object.keys(STONES) as Stone[]
