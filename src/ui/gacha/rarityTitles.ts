import { Rarity, RARITY_INFO } from '../../data/species'

/** Título de cada desplegable de rareza: la rareza en plural */
export const RARITY_TITLE: Record<Rarity, string> = {
  [Rarity.Common]: 'Comunes',
  [Rarity.Rare]: 'Raros',
  [Rarity.Epic]: 'Épicos',
  [Rarity.Legendary]: 'Legendarios',
}

/** Rarezas de la más común a la más rara, en el orden de los desplegables */
export const RARITIES = Object.keys(RARITY_INFO) as Rarity[]
