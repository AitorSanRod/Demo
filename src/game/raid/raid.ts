import { route } from '../../data/maps'
import { RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import { markSeen } from '../collection/dex'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { ranchPassives } from '../team/ranchPassives'
import { gainExp, maxHp } from '../team/stats'
import { elapseRound, playRound, RAID_ROUND_MS, type PassivesOf } from './raidCombat'
import { updateBots } from './raidBots'
import { earnsPrize, rollPrize } from './raidPrizes'
import { hasRoom, newMember, presentMembers, RaidMemberKind, type Raid, type RaidMember } from './raidRoom'

/** Minutos de juego que tardaría en caer un jefe con un solo Pokémon de su nivel (sin bots ni más jugadores) */
export const RAID_SOLO_MINUTES = 180
/** Potencia del ataque de referencia con el que se calcula la vida del jefe (entre el común y el raro) */
const REFERENCE_POWER = 60
/** Fracción del tiempo que pasa luchando un Pokémon de referencia (el resto, debilitado esperando a revivir) */
const REFERENCE_UPTIME = 0.5
/** Pokémon del jugador que pueden estar a la vez en la sala */
export const RAID_PLAYER_SLOTS = 1
/** EXP por minuto de juego luchando (no mientras está debilitado), por cada nivel del jefe */
export const RAID_EXP_PER_MINUTE_PER_LEVEL = 1
/** Nombre con el que sale el jugador en la sala */
const PLAYER_TRAINER = 'Tú'

/** Vida del jefe: la que quitaría en RAID_SOLO_MINUTES un Pokémon de su nivel con un ataque de referencia */
export function raidBossHp(level: number): number {
  const hit = (((2 * level) / 5 + 2) * REFERENCE_POWER) / 50 + 2
  return Math.round(hit * REFERENCE_UPTIME * ((RAID_SOLO_MINUTES * 60_000) / RAID_ROUND_MS))
}

export const raidBossAt = (felled: number): RaidBoss => RAID_BOSSES[felled % RAID_BOSSES.length]

/** Nuevo jefe; los que siguen en la sala se quedan para el siguiente, recuperados y con el contador a cero */
function spawnRaid(felled: number, stayers: RaidMember[], nextBotId: number): Raid {
  const boss = raidBossAt(felled)
  const hp = raidBossHp(boss.level)
  const members = stayers.map((m) => newMember(m, 1, m.stayMs))
  return { boss, hp, maxHp: hp, elapsedMs: 0, roundMsLeft: RAID_ROUND_MS, round: 0, members, lastRound: [], felled, nextBotId }
}

export const playerMembers = (raid: Raid) => presentMembers(raid).filter((m) => m.kind === RaidMemberKind.Player)

/** Hay jefe en cuanto termina el tutorial */
export function ensureRaid(s: GameState) {
  if (!s.raid && s.tutorial === null) s.raid = spawnRaid(0, [], 0)
}

/** Si el jefe activo vive en una ruta que el jugador aún no ha desbloqueado */
export function raidRouteLocked(s: GameState): boolean {
  const routeId = s.raid?.boss.routeId
  return !!routeId && !s.unlockedRoutes.includes(routeId)
}

export function raidBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!s.raid) return 'Todavía no hay ningún jefe.'
  if (raidRouteLocked(s)) return `Vive en ${route(s.raid.boss.routeId!).name}: desbloquéala para luchar contra él.`
  if (!mon) return 'Ese Pokémon no existe.'
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede ir desde el rancho.'
  if (playerMembers(s.raid).length >= RAID_PLAYER_SLOTS) return 'Ya tienes un Pokémon luchando contra el jefe.'
  if (!hasRoom(s.raid)) return 'La sala está llena.'
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

/** Manda al Pokémon a la sala; si ya estuvo contra este jefe, conserva su tiempo y su daño */
export function joinRaid(s: GameState, uid: string) {
  if (raidBlocker(s, uid)) return
  const raid = s.raid!
  const mon = findMon(s, uid)!
  const hpFraction = mon.hp / maxHp(mon)
  const before = raid.members.find((m) => m.id === uid)
  if (before) Object.assign(before, { left: false, hpFraction, downMs: 0 })
  else {
    const who = { id: uid, kind: RaidMemberKind.Player, trainer: PLAYER_TRAINER, speciesId: mon.speciesId, level: mon.level, stars: mon.stars }
    raid.members.push(newMember(who, hpFraction))
  }
  markSeen(s, raid.boss.speciesId)
}

/** Sale de la sala y vuelve al rancho con los PS que le queden */
function backToRanch(s: GameState, m: RaidMember) {
  const mon = findMon(s, m.id)
  m.left = true
  if (mon) mon.hp = Math.round(maxHp(mon) * m.hpFraction)
}

/** Retirada antes de tiempo; si ya cumple el mínimo de presencia, cobrará cuando caiga el jefe */
export function leaveRaid(s: GameState, uid: string) {
  const m = s.raid && playerMembers(s.raid).find((x) => x.id === uid)
  if (m) backToRanch(s, m)
}

export const passivesOf =
  (s: GameState): PassivesOf =>
  (m) => {
    const mon = m.kind === RaidMemberKind.Player ? findMon(s, m.id) : undefined
    return mon && mon.ranch !== null ? ranchPassives(s, mon.ranch) : []
  }

/** EXP que gana un Pokémon del jugador por cada ronda que empieza en pie */
export const raidExpPerRound = (boss: RaidBoss): number =>
  Math.max(1, Math.round((boss.level * RAID_EXP_PER_MINUTE_PER_LEVEL * RAID_ROUND_MS) / 60_000))

/** Los del jugador ganan la EXP de la ronda si están en pie y luchan con su nivel y sus ★ de ahora */
function syncPlayers(s: GameState, raid: Raid) {
  for (const m of playerMembers(raid)) {
    const mon = findMon(s, m.id)
    if (!mon) {
      m.left = true
      continue
    }
    if (m.downMs === 0) gainExp(mon, raidExpPerRound(raid.boss))
    Object.assign(m, { level: mon.level, stars: mon.stars })
  }
}

/**
 * Deja pendiente el premio de los del jugador que cobran, que vuelven al rancho, y sale el siguiente jefe con los bots
 * que siguen dentro
 */
function fall(s: GameState, raid: Raid, rng: Rng) {
  for (const m of raid.members) {
    if (m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs)) s.raidPrizes.push(rollPrize(raid.boss, rng))
  }
  for (const m of playerMembers(raid)) backToRanch(s, m)
  s.raid = spawnRaid(raid.felled + 1, presentMembers(raid), raid.nextBotId)
}

/** Avanza la pelea `ms` milisegundos de juego, ronda a ronda */
export function advanceRaid(s: GameState, ms: number, rng: Rng = Math.random) {
  ensureRaid(s)
  let left = ms
  while (s.raid && left >= s.raid.roundMsLeft) {
    const raid = s.raid
    left -= raid.roundMsLeft
    raid.roundMsLeft = RAID_ROUND_MS
    raid.round++
    elapseRound(raid)
    updateBots(raid, RAID_ROUND_MS, rng)
    syncPlayers(s, raid)
    raid.lastRound = playRound(raid, passivesOf(s), rng)
    if (raid.hp === 0) fall(s, raid, rng)
  }
  if (s.raid) s.raid.roundMsLeft -= left
}
