import { RAID_ROUND_MS, type PassivesOf } from '../raidCombat'
import { roomPace } from '../raidEstimate'
import { presentMembers, type Raid } from '../raidRoom'
import type { SharedRoom } from './sharedRoom'

// El servidor (un Worker de Cloudflare) tiene muy poca CPU por petición: una sala que lleva horas sin consultas no se
// puede jugar ronda a ronda. Lo antiguo se resume con el ritmo de la sala y solo lo último se juega de verdad.

/** Rondas que, como mucho, se juegan de verdad en una consulta (cada una cuesta ≈ 50 µs); lo anterior se resume */
export const ROOM_PLAYED_ROUNDS = 30

const seatPassives = (room: SharedRoom): PassivesOf => {
  const byMember = new Map(Object.values(room.seats).map((seat) => [seat.memberId, seat.passives]))
  return (m) => byMember.get(m.id) ?? []
}

/** Rondas que tardaría en caer el jefe a ese ritmo; Infinity si nadie le hace daño */
const roundsToFall = (raid: Raid, perRound: number) => (perRound > 0 ? Math.ceil(raid.hp / perRound) : Infinity)

/**
 * Resume `ms` de pelea sin jugarlos: al ritmo de los que están dentro (roomPace), el jefe pierde vida (hasta caer, si
 * le llega), cada uno suma tiempo, daño y rondas de EXP, y los bots que cumplen su tiempo se van. En el resumen nadie
 * cae ni entra: todos acaban en pie
 */
export function skipAhead(room: SharedRoom, ms: number) {
  const { raid } = room
  const rounds = Math.floor(ms / RAID_ROUND_MS)
  if (rounds === 0 || raid.hp === 0) return
  const pace = roomPace(raid, seatPassives(room))
  const toFall = roundsToFall(raid, pace.perRound)
  const played = Math.min(rounds, toFall)
  const playedMs = played * RAID_ROUND_MS

  raid.hp = played === toFall ? 0 : Math.max(1, Math.round(raid.hp - pace.perRound * played))
  raid.round += played
  raid.elapsedMs += playedMs
  raid.sinceBotMs += playedMs
  raid.lastRound = []
  for (const seat of Object.values(room.seats)) {
    const share = pace.byMember[seat.memberId]?.upShare ?? 0
    if (presentMembers(raid).some((m) => m.id === seat.memberId)) seat.expRounds += Math.round(share * played)
  }
  for (const m of presentMembers(raid)) {
    m.presentMs += playedMs
    m.damage += Math.round((pace.byMember[m.id]?.damagePerRound ?? 0) * played)
    Object.assign(m, { downMs: 0, hpFraction: 1 })
    if (m.stayMs === null) continue
    m.stayMs = Math.max(0, m.stayMs - playedMs)
    if (m.stayMs === 0) m.left = true
  }
}
