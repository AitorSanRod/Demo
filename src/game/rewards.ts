import { randInt, type Rng } from './random'

/** Probabilidad de que un salvaje derrotado suelte un ticket del gacha */
const TICKET_DROP_CHANCE = 0.15

/** Pokécuartos por victoria: 8 + 4 por nivel del rival + 0..5 al azar */
export function moneyReward(enemyLevel: number, rng: Rng): number {
  return 8 + enemyLevel * 4 + randInt(0, 5, rng)
}

export function ticketReward(rng: Rng): number {
  return rng() < TICKET_DROP_CHANCE ? 1 : 0
}
