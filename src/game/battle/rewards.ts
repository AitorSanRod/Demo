import { rarityOf, species, type Rarity } from '../../data/species'
import { randInt, type Rng } from '../core/random'

/** Probabilidad de que un salvaje derrotado suelte un ticket del gacha, según su rareza */
export const TICKET_DROP_CHANCE: Record<Rarity, number> = { common: 0.05, rare: 0.05, epic: 0.5, legendary: 0.75 }

/** Probabilidad de que un salvaje derrotado suelte 1 pieza de su especie, según su rareza */
export const PIECE_DROP_CHANCE: Record<Rarity, number> = { common: 0.05, rare: 0.05, epic: 0.05, legendary: 0.5 }

/** Multiplicador de todo el dinero que se gana (combates, expediciones, premios de ruta y de jefes, tickets sobrantes) */
export const MONEY_GAIN_MULT = 1.15

/** Aplica MONEY_GAIN_MULT a una cantidad de pokécuartos ganada, redondeando al entero más cercano */
export const boostedMoney = (amount: number): number => Math.round(amount * MONEY_GAIN_MULT)

/** Pokécuartos por victoria por cada nivel del rival (se redondea hacia arriba) */
export const MONEY_PER_LEVEL = 0.5
/** Pokécuartos extra por victoria, al azar entre ambos valores (incluidos) */
export const MONEY_BONUS_RANGE: readonly [number, number] = [2, 3]

/** Pokécuartos por victoria: nivel del rival × MONEY_PER_LEVEL + MONEY_BONUS_RANGE al azar, con MONEY_GAIN_MULT */
export function moneyReward(enemyLevel: number, rng: Rng): number {
  return boostedMoney(Math.ceil(enemyLevel * MONEY_PER_LEVEL) + randInt(MONEY_BONUS_RANGE[0], MONEY_BONUS_RANGE[1], rng))
}

/** EXP por victoria por cada nivel del rival */
export const EXP_PER_LEVEL = 3
/** Un rival con más de estos niveles por debajo del Pokémon del jugador no da EXP */
export const EXP_LEVEL_GAP = 3

/** EXP por victoria: nivel del rival × EXP_PER_LEVEL, o nada si el rival es más de EXP_LEVEL_GAP niveles inferior */
export function expReward(enemyLevel: number, playerLevel: number): number {
  return enemyLevel < playerLevel - EXP_LEVEL_GAP ? 0 : enemyLevel * EXP_PER_LEVEL
}

export function pieceReward(enemySpeciesId: number, rng: Rng): boolean {
  return rng() < PIECE_DROP_CHANCE[rarityOf(species(enemySpeciesId))]
}

export function ticketReward(enemySpeciesId: number, rng: Rng): number {
  return rng() < TICKET_DROP_CHANCE[rarityOf(species(enemySpeciesId))] ? 1 : 0
}
