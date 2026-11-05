import { rarityOf, species, type Rarity } from '../../data/species'
import type { Rng } from '../core/random'

/** Probabilidad de que un salvaje derrotado suelte un ticket del gacha, según su rareza */
export const TICKET_DROP_CHANCE: Record<Rarity, number> = { common: 0.05, rare: 0.05, epic: 0.5, legendary: 0.75 }

/** Probabilidad de que un salvaje derrotado suelte 1 pieza de su especie, según su rareza */
export const PIECE_DROP_CHANCE: Record<Rarity, number> = { common: 0.05, rare: 0.05, epic: 0.05, legendary: 0.5 }

/** Multiplicador de todo el dinero que se gana (combates, expediciones, premios de ruta y de jefes, tickets sobrantes) */
export const MONEY_GAIN_MULT = 1.15

/** Aplica MONEY_GAIN_MULT a una cantidad de pokécuartos ganada, redondeando al entero más cercano */
export const boostedMoney = (amount: number): number => Math.round(amount * MONEY_GAIN_MULT)

/**
 * Pokécuartos por victoria por cada paso andado hasta ese combate (a nivel 0): el premio va con el camino, para que
 * una ruta de tramos largos rinda por minuto lo mismo que una de tramos cortos
 */
export const MONEY_PER_STEP = 0.2
/** Lo que crece el ₽ por paso con cada nivel del rival: 0.1 es +10% del de nivel 0 por cada nivel */
export const MONEY_STEP_LEVEL_GROWTH = 0.1
/** Variación al azar del dinero de una victoria: entre ×(1 − MONEY_SPREAD) y ×(1 + MONEY_SPREAD) */
export const MONEY_SPREAD = 0.15

/** Pokécuartos por paso andado hasta el combate contra un rival de ese nivel (sin azar ni MONEY_GAIN_MULT) */
export const moneyPerStep = (enemyLevel: number): number => MONEY_PER_STEP * (1 + enemyLevel * MONEY_STEP_LEVEL_GROWTH)

/** Pokécuartos por victoria: pasos del tramo × moneyPerStep, ±MONEY_SPREAD al azar y con MONEY_GAIN_MULT (mín. 1) */
export function moneyReward(enemyLevel: number, legSteps: number, rng: Rng): number {
  const spread = 1 + (rng() * 2 - 1) * MONEY_SPREAD
  return Math.max(1, boostedMoney(legSteps * moneyPerStep(enemyLevel) * spread))
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
