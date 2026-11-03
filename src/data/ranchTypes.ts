import type { PokeType } from './types'

// Tipos de rancho: objetos que se compran en la Tienda y se colocan en un rancho. En ese rancho hace falta un Pokémon
// menos de cada tipo que favorece para cada nivel de su pasiva. Este fichero es para editarlo a mano.

/** Objetos de cada tipo de rancho que se pueden tener como mucho, entre guardados y colocados */
export const RANCH_TYPE_MAX_OWNED = 3
/** Pokémon menos que hacen falta, en un rancho que favorece su tipo, para cada nivel de la pasiva */
export const RANCH_TYPE_THRESHOLD_DISCOUNT = 1

export const RanchTypeId = {
  Ocean: 'ocean',
  Volcano: 'volcano',
  Forest: 'forest',
  PowerPlant: 'power-plant',
  Glacier: 'glacier',
  Dojo: 'dojo',
  Swamp: 'swamp',
  Sky: 'sky',
  Temple: 'temple',
  Graveyard: 'graveyard',
  Mountain: 'mountain',
  Coast: 'coast',
  Jungle: 'jungle',
  Cave: 'cave',
  Factory: 'factory',
  Meadow: 'meadow',
} as const
export type RanchTypeId = (typeof RanchTypeId)[keyof typeof RanchTypeId]

export interface RanchTypeInfo {
  name: string
  /** Tipos de Pokémon a los que favorece */
  favors: PokeType[]
  /** ₽ que cuesta cada objeto */
  price: number
}

/** Precio de un tipo de rancho que favorece a un tipo de Pokémon */
const SINGLE_TYPE_PRICE = 10000
/** Precio de un tipo de rancho que favorece a dos tipos de Pokémon */
const DOUBLE_TYPE_PRICE = 25000

export const RANCH_TYPES: Record<RanchTypeId, RanchTypeInfo> = {
  [RanchTypeId.Ocean]: { name: 'Océano', favors: ['water'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Volcano]: { name: 'Volcán', favors: ['fire'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Forest]: { name: 'Bosque', favors: ['grass'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.PowerPlant]: { name: 'Central', favors: ['electric'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Glacier]: { name: 'Glaciar', favors: ['ice'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Dojo]: { name: 'Dojo', favors: ['fighting'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Swamp]: { name: 'Pantano', favors: ['poison'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Sky]: { name: 'Cielo', favors: ['flying'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Temple]: { name: 'Templo', favors: ['psychic'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Graveyard]: { name: 'Cementerio', favors: ['ghost'], price: SINGLE_TYPE_PRICE },
  [RanchTypeId.Mountain]: { name: 'Montaña', favors: ['rock', 'ground'], price: DOUBLE_TYPE_PRICE },
  [RanchTypeId.Coast]: { name: 'Costa', favors: ['water', 'flying'], price: DOUBLE_TYPE_PRICE },
  [RanchTypeId.Jungle]: { name: 'Selva', favors: ['grass', 'bug'], price: DOUBLE_TYPE_PRICE },
  [RanchTypeId.Cave]: { name: 'Cueva', favors: ['rock', 'ghost'], price: DOUBLE_TYPE_PRICE },
  [RanchTypeId.Factory]: { name: 'Fábrica', favors: ['steel', 'electric'], price: DOUBLE_TYPE_PRICE },
  [RanchTypeId.Meadow]: { name: 'Pradera', favors: ['normal', 'fairy'], price: DOUBLE_TYPE_PRICE },
}

export const RANCH_TYPE_IDS = Object.keys(RANCH_TYPES) as RanchTypeId[]
