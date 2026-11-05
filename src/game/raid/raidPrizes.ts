import { RAID_PRIZE_TABLES, RaidPrizeKind, type RaidBoss } from '../../data/raidBosses'
import { boostedMoney } from '../battle/rewards'
import { markSeen } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import type { Rng } from '../core/random'
import { findMon, type GameState } from '../core/state'
import { gainExp } from '../team/stats'
import type { RaidMember, RaidPrize } from './raidRoom'

/** Fracción mínima de la pelea (desde que apareció el jefe hasta que cayó) que hay que haber estado dentro para cobrar */
export const RAID_MIN_PRESENCE = 0.1

/** Fracción de la pelea que ha estado dentro (1 al empezar, cuando aún no ha pasado tiempo) */
export const presenceShare = (m: RaidMember, fightMs: number): number => (fightMs > 0 ? Math.min(1, m.presentMs / fightMs) : 1)

/** Cobra quien estuvo dentro al menos RAID_MIN_PRESENCE de la pelea o quien seguía dentro cuando cayó el jefe */
export const earnsPrize = (m: RaidMember, fightMs: number): boolean => !m.left || m.presentMs >= fightMs * RAID_MIN_PRESENCE

/** Tira cada línea de la tabla de premios de la categoría del jefe por separado; la EXP es para el Pokémon `uid` */
export function rollPrize(boss: RaidBoss, uid: string, rng: Rng): RaidPrize {
  const prize: RaidPrize = { bossSpeciesId: boss.speciesId, uid, money: 0, tickets: 0, pieces: 0, exp: 0 }
  const field: Record<RaidPrizeKind, 'money' | 'tickets' | 'pieces' | 'exp'> = {
    [RaidPrizeKind.Money]: 'money',
    [RaidPrizeKind.Tickets]: 'tickets',
    [RaidPrizeKind.BossPieces]: 'pieces',
    [RaidPrizeKind.Exp]: 'exp',
  }
  for (const roll of RAID_PRIZE_TABLES[boss.tier]) if (rng() < roll.chance) prize[field[roll.kind]] += roll.amount
  prize.money = boostedMoney(prize.money)
  return prize
}

/**
 * Suma un premio a la partida: su EXP, al Pokémon que luchó (si ya no está, se pierde); el jefe queda visto en la
 * Pokédex para poder usar sus tickets. Devuelve los niveles que ha subido ese Pokémon
 */
export function applyPrize(s: GameState, p: RaidPrize): number {
  s.money += p.money
  s.tickets += p.tickets
  markSeen(s, p.bossSpeciesId)
  if (p.pieces > 0) addPieces(s, p.bossSpeciesId, p.pieces)
  const mon = findMon(s, p.uid)
  return mon && p.exp > 0 ? gainExp(mon, p.exp).levelsGained : 0
}

/** Entrega los premios pendientes de los jefes de la pestaña Raids */
export function collectRaidPrizes(s: GameState): RaidPrize[] {
  const prizes = s.raidPrizes
  s.raidPrizes = []
  for (const p of prizes) applyPrize(s, p)
  return prizes
}
