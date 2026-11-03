import { seededRng } from '../core/random'
import type { GameState } from '../core/state'
import { passivesOf } from './raidEngine'
import { elapseRound, playRound, RAID_ROUND_MS, type PassivesOf } from './raidCombat'
import { BOSS_ID, type Raid } from './raidRoom'

/** Rondas que se simulan para estimar el daño de la sala (bastantes para que cuenten las caídas y los revivir) */
const ESTIMATE_ROUNDS = 60
/** Semilla fija: con la misma sala sale la misma estimación y la cifra no baila en cada refresco */
const ESTIMATE_SEED = 1

/** Daño medio por ronda de los que están ahora en la sala: se simulan rondas sobre una copia, sin que entre ni salga nadie */
export function raidDamagePerRound(raid: Raid, passives: PassivesOf): number {
  const copy = structuredClone(raid)
  copy.hp = copy.maxHp = Number.MAX_SAFE_INTEGER
  const rng = seededRng(ESTIMATE_SEED)
  let dealt = 0
  for (let i = 0; i < ESTIMATE_ROUNDS; i++) {
    elapseRound(copy)
    for (const hit of playRound(copy, passives, rng)) if (hit.to === BOSS_ID) dealt += hit.dealt
  }
  return dealt / ESTIMATE_ROUNDS
}

/** Minutos de juego que tardará en caer el jefe con los que hay ahora en la sala; null si nadie puede hacerle daño */
export function raidMinutesLeft(s: GameState, raid: Raid): number | null {
  const perRound = raidDamagePerRound(raid, passivesOf(s))
  return perRound > 0 ? ((raid.hp / perRound) * RAID_ROUND_MS) / 60_000 : null
}
