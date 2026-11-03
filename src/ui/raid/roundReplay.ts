import { RAID_ROUND_MS } from '../../game/raid/raidCombat'
import { BOSS_ID, type Raid, type RaidHit } from '../../game/raid/raidRoom'

/** Milisegundos reales que se ve cada golpe (embestida, temblor y número) */
const HIT_VISIBLE_MS = 700

/** Golpe de la última ronda con su turno: `seq` es único y crece golpe a golpe, `at` el ms de la ronda en que se ve */
export interface ReplayHit extends RaidHit {
  seq: number
  at: number
}

/**
 * Los golpes de la última ronda se juegan de una vez en el motor; aquí se reparten en orden a lo largo de la ronda
 * siguiente, con el del jefe a mitad, para que la pelea se vea por turnos y no toda a la vez
 */
export function replayHits(raid: Raid): ReplayHit[] {
  const party = raid.lastRound.filter((h) => h.from !== BOSS_ID)
  const boss = raid.lastRound.filter((h) => h.from === BOSS_ID)
  const half = Math.ceil(party.length / 2)
  const ordered = [...party.slice(0, half), ...boss, ...party.slice(half)]
  return ordered.map((h, i) => ({ ...h, seq: raid.round * 100 + i, at: (i * RAID_ROUND_MS) / ordered.length }))
}

const elapsedInRound = (raid: Raid) => RAID_ROUND_MS - raid.roundMsLeft

/** Golpes que se están viendo ahora (a mucha velocidad de juego, varios a la vez) */
export function visibleHits(raid: Raid, timeScale: number): ReplayHit[] {
  const elapsed = elapsedInRound(raid)
  const visibleFor = HIT_VISIBLE_MS * timeScale
  return replayHits(raid).filter((h) => elapsed >= h.at && elapsed < h.at + visibleFor)
}

/** Vida del jefe que se ve: la de ahora más el daño de los golpes de la ronda que aún no han salido */
export function shownBossHp(raid: Raid): number {
  const elapsed = elapsedInRound(raid)
  const pending = replayHits(raid).filter((h) => h.to === BOSS_ID && h.at > elapsed)
  return Math.min(raid.maxHp, raid.hp + pending.reduce((sum, h) => sum + h.dealt, 0))
}
