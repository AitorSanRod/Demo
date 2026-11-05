import { ITEM } from './items'

/** Pociones de las paradas de curación (`NodeKind.Heal`). El valor es también su icono de PokeAPI */
export const Potion = {
  Potion: ITEM.Potion,
  SuperPotion: ITEM.SuperPotion,
  HyperPotion: ITEM.HyperPotion,
  FullRestore: ITEM.FullRestore,
} as const
export type Potion = (typeof Potion)[keyof typeof Potion]

interface PotionInfo {
  name: string
  /** PS que recupera; null los recupera todos */
  hp: number | null
}

export const POTION_INFO: Record<Potion, PotionInfo> = {
  [Potion.Potion]: { name: 'Poción', hp: 50 },
  [Potion.SuperPotion]: { name: 'Superpoción', hp: 120 },
  [Potion.HyperPotion]: { name: 'Hiperpoción', hp: 200 },
  [Potion.FullRestore]: { name: 'Restaurar todo', hp: null },
}
