import type { RaidBoss } from '../../data/raidBosses'
import { markSeen } from '../collection/dex'
import type { Rng } from '../core/random'
import { findMon, type GameState, type OwnedMon } from '../core/state'
import { ranchPassives } from '../team/ranchPassives'
import { gainExp, maxHp } from '../team/stats'
import { elapseRound, playRound, RAID_ROUND_MS, type PassivesOf } from './raidCombat'
import { updateBots, type BotPolicy } from './raidBots'
import { earnsPrize, rollPrize } from './raidPrizes'
import { newMember, outOfLives, presentMembers, RaidMemberKind, type Raid, type RaidMember, type RaidPlace, type RaidPrize } from './raidRoom'

// Lo común a todas las salas de jefe comunitario (la de la pestaña Raids y las de las paradas de ruta): crearlas,
// entrar y salir, y avanzar sus rondas.

/** Minutos de juego que tardaría en caer un jefe con un solo Pokémon de su nivel (sin bots ni más jugadores), si el jefe no dice los suyos */
export const RAID_SOLO_MINUTES = 180
/** Potencia del ataque de referencia con el que se calcula la vida del jefe (entre el común y el raro) */
const REFERENCE_POWER = 60
/** Fracción del tiempo que pasa luchando un Pokémon de referencia (el resto, debilitado esperando a revivir) */
const REFERENCE_UPTIME = 0.5
/** EXP por minuto de juego luchando (no mientras está debilitado), por cada nivel del jefe */
export const RAID_EXP_PER_MINUTE_PER_LEVEL = 1
/** Nombre con el que sale el jugador en la sala */
const PLAYER_TRAINER = 'Tú'

/**
 * Vida del jefe: la que quitaría en `soloMinutes` (o RAID_SOLO_MINUTES) un Pokémon de su nivel con un ataque de
 * referencia. Así lo que tarda depende de quién luche: uno de nivel mucho más alto lo tira en minutos
 */
export function raidBossHp(boss: Pick<RaidBoss, 'level' | 'soloMinutes'>): number {
  const hit = (((2 * boss.level) / 5 + 2) * REFERENCE_POWER) / 50 + 2
  const minutes = boss.soloMinutes ?? RAID_SOLO_MINUTES
  return Math.round(hit * REFERENCE_UPTIME * ((minutes * 60_000) / RAID_ROUND_MS))
}

/** Sala nueva con el jefe entero; los `stayers` siguen dentro, recuperados y con el contador a cero */
export function newRaid(boss: RaidBoss, place: RaidPlace | null, opts: { felled?: number; stayers?: RaidMember[]; nextBotId?: number } = {}): Raid {
  const hp = raidBossHp(boss)
  const members = (opts.stayers ?? []).map((m) => newMember(m, 1, m.stayMs))
  return { boss, place, hp, maxHp: hp, elapsedMs: 0, roundMsLeft: RAID_ROUND_MS, round: 0, members, lastRound: [], felled: opts.felled ?? 0, nextBotId: opts.nextBotId ?? 0 }
}

export const playerMembers = (raid: Raid) => presentMembers(raid).filter((m) => m.kind === RaidMemberKind.Player)

/**
 * Mete al Pokémon en la sala con sus PS de ahora y `lives` vidas (null, sin límite); si ya estuvo contra este jefe,
 * conserva su tiempo y su daño
 */
export function addPlayer(s: GameState, raid: Raid, mon: OwnedMon, lives: number | null = null) {
  const hpFraction = mon.hp / maxHp(mon)
  const before = raid.members.find((m) => m.id === mon.uid)
  if (before) Object.assign(before, { left: false, hpFraction, downMs: 0, lives })
  else {
    const who = { id: mon.uid, kind: RaidMemberKind.Player, trainer: PLAYER_TRAINER, speciesId: mon.speciesId, level: mon.level, stars: mon.stars }
    raid.members.push({ ...newMember(who, hpFraction), lives })
  }
  markSeen(s, raid.boss.speciesId)
}

/** Sale de la sala con los PS que le queden; se le recuerda para el reparto */
export function removePlayer(s: GameState, m: RaidMember) {
  const mon = findMon(s, m.id)
  m.left = true
  if (mon) mon.hp = Math.round(maxHp(mon) * m.hpFraction)
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
 * Juega las rondas que caben en `ms` milisegundos de juego. Si el jefe cae o un Pokémon del jugador gasta sus vidas,
 * se para ahí y devuelve los milisegundos que sobran; si no, null
 */
export function advanceRoom(s: GameState, raid: Raid, ms: number, bots: BotPolicy, rng: Rng): number | null {
  let left = ms
  while (left >= raid.roundMsLeft) {
    left -= raid.roundMsLeft
    raid.roundMsLeft = RAID_ROUND_MS
    raid.round++
    elapseRound(raid)
    updateBots(raid, RAID_ROUND_MS, bots, rng)
    syncPlayers(s, raid)
    raid.lastRound = playRound(raid, passivesOf(s), rng)
    if (raid.hp === 0 || playerMembers(raid).some(outOfLives)) return left
  }
  raid.roundMsLeft -= left
  return null
}

/**
 * Al caer el jefe: tira el premio de cada Pokémon del jugador que cobra y los que siguen dentro salen de la sala.
 * Devuelve los premios; cada clase de sala decide qué hace con ellos
 */
export function settleFall(s: GameState, raid: Raid, rng: Rng): RaidPrize[] {
  const prizes = raid.members.filter((m) => m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs)).map(() => rollPrize(raid.boss, rng))
  for (const m of playerMembers(raid)) removePlayer(s, m)
  return prizes
}
