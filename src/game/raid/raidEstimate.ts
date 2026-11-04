import { seededRng } from '../core/random'
import type { GameState } from '../core/state'
import { passivesOf } from './raidEngine'
import { elapseRound, playRound, RAID_ROUND_MS, type PassivesOf } from './raidCombat'
import { BOSS_ID, type Raid } from './raidRoom'

/** Rondas que se simulan para estimar el daño de la sala (bastantes para que cuenten las caídas y los revivir) */
const ESTIMATE_ROUNDS = 60
/** Semilla fija: con la misma sala sale la misma estimación y la cifra no baila en cada refresco */
const ESTIMATE_SEED = 1

/** Ritmo de la sala: daño medio por ronda al jefe y, por participante, su daño medio y la fracción de rondas que empieza en pie */
interface RoomPace {
  perRound: number
  byMember: Record<string, { damagePerRound: number; upShare: number }>
}

/** Ritmo de los que están ahora en la sala: se simulan rondas sobre una copia, sin que entre ni salga nadie */
export function roomPace(raid: Raid, passives: PassivesOf): RoomPace {
  const copy = structuredClone(raid)
  copy.hp = copy.maxHp = Number.MAX_SAFE_INTEGER
  const rng = seededRng(ESTIMATE_SEED)
  const totals: Record<string, { damage: number; up: number }> = {}
  for (const m of copy.members) totals[m.id] = { damage: 0, up: 0 }
  let dealt = 0
  for (let i = 0; i < ESTIMATE_ROUNDS; i++) {
    elapseRound(copy)
    for (const m of copy.members) if (!m.left && m.downMs === 0) totals[m.id].up++
    for (const hit of playRound(copy, passives, rng)) {
      if (hit.to !== BOSS_ID) continue
      dealt += hit.dealt
      totals[hit.from].damage += hit.dealt
    }
  }
  const byMember = Object.fromEntries(
    Object.entries(totals).map(([id, t]) => [id, { damagePerRound: t.damage / ESTIMATE_ROUNDS, upShare: t.up / ESTIMATE_ROUNDS }]),
  )
  return { perRound: dealt / ESTIMATE_ROUNDS, byMember }
}

/** Daño medio por ronda de los que están ahora en la sala */
export const raidDamagePerRound = (raid: Raid, passives: PassivesOf): number => roomPace(raid, passives).perRound

/** Minutos de juego que tardará en caer el jefe con los que hay ahora en la sala; null si nadie puede hacerle daño */
export function raidMinutesLeft(s: GameState, raid: Raid): number | null {
  const perRound = raidDamagePerRound(raid, passivesOf(s))
  return perRound > 0 ? ((raid.hp / perRound) * RAID_ROUND_MS) / 60_000 : null
}
