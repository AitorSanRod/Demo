import { rarityOf, species, type Rarity } from '../../data/species'
import { randInt, type Rng } from '../core/random'

/** Probabilidad de que un salvaje derrotado suelte un ticket del gacha, según su rareza */
export const TICKET_DROP_CHANCE: Record<Rarity, number> = { common: 0.1, rare: 0.2, epic: 0.35, legendary: 0.6 }

/** Probabilidad de que un salvaje derrotado suelte 1 pieza de su especie, según su rareza */
export const PIECE_DROP_CHANCE: Record<Rarity, number> = { common: 0.05, rare: 0.04, epic: 0.03, legendary: 0.025 }

/** Pokécuartos por victoria: 8 + 4 por nivel del rival + 0..5 al azar */
export function moneyReward(enemyLevel: number, rng: Rng): number {
  return 8 + enemyLevel * 4 + randInt(0, 5, rng)
}

export function pieceReward(enemySpeciesId: number, rng: Rng): boolean {
  return rng() < PIECE_DROP_CHANCE[rarityOf(species(enemySpeciesId))]
}

export function ticketReward(enemySpeciesId: number, rng: Rng): number {
  return rng() < TICKET_DROP_CHANCE[rarityOf(species(enemySpeciesId))] ? 1 : 0
}
