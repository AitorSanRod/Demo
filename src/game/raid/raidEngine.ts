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
const RAID_EXP_PER_MINUTE_PER_LEVEL = 1
/** Nombre con el que sale el jugador en la sala */
export const PLAYER_TRAINER = 'Tú'

/**
 * Vida del jefe: la que quitaría en `soloMinutes` (o RAID_SOLO_MINUTES) un Pokémon de su nivel con un ataque de
 * referencia. Así lo que tarda depende de quién luche: uno de nivel mucho más alto lo tira en minutos
 */
export function raidBossHp(boss: Pick<RaidBoss, 'level' | 'soloMinutes'>): number {
  const hit = (((2 * boss.level) / 5 + 2) * REFERENCE_POWER) / 50 + 2
  const minutes = boss.soloMinutes ?? RAID_SOLO_MINUTES
  return Math.round(hit * REFERENCE_UPTIME * ((minutes * 60_000) / RAID_ROUND_MS))
}

/** Sala nueva y vacía con el jefe entero; `startsInMs` es lo que tarda en aparecer (0, ya está) */
export function newRaid(boss: RaidBoss, place: RaidPlace | null, opts: { felled?: number; nextBotId?: number; startsInMs?: number } = {}): Raid {
  const hp = raidBossHp(boss)
  return {
    boss,
    place,
    hp,
    maxHp: hp,
    elapsedMs: 0,
    roundMsLeft: RAID_ROUND_MS,
    round: 0,
    members: [],
    lastRound: [],
    felled: opts.felled ?? 0,
    nextBotId: opts.nextBotId ?? 0,
    sinceBotMs: 0,
    startsInMs: opts.startsInMs ?? 0,
    remote: null,
  }
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

/** Lo que cada clase de motor (la partida local o el servidor) pone en cada ronda */
export interface RoomHooks {
  passivesOf: PassivesOf
  /** Antes de jugar la ronda, con el tiempo ya pasado: EXP y nivel de los Pokémon de los jugadores */
  beforeRound: (raid: Raid) => void
}

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

/** Ganchos de la partida local: las pasivas del rancho de cada uno y la EXP a los Pokémon del jugador */
export const localHooks = (s: GameState): RoomHooks => ({ passivesOf: passivesOf(s), beforeRound: (raid) => syncPlayers(s, raid) })

/** La pelea se para: ha caído el jefe o un Pokémon de un jugador ha gastado sus vidas */
const roomStopped = (raid: Raid): boolean => raid.hp === 0 || playerMembers(raid).some(outOfLives)

/**
 * Juega las rondas que caben en `ms` milisegundos de juego. Si el jefe cae o un Pokémon del jugador gasta sus vidas,
 * se para ahí y devuelve los milisegundos que sobran; si no, null
 */
export function advanceRoom(raid: Raid, ms: number, bots: BotPolicy, rng: Rng, hooks: RoomHooks): number | null {
  let left = ms
  while (left >= raid.roundMsLeft) {
    left -= raid.roundMsLeft
    raid.roundMsLeft = RAID_ROUND_MS
    raid.round++
    elapseRound(raid)
    updateBots(raid, RAID_ROUND_MS, bots, rng)
    hooks.beforeRound(raid)
    raid.lastRound = playRound(raid, hooks.passivesOf, rng)
    if (roomStopped(raid)) return left
  }
  raid.roundMsLeft -= left
  return null
}

/** Sala enlazada al servidor: no se juega aquí, solo corre el reloj de la ronda para que la UI reparta sus golpes */
export function runLinkedClock(raid: Raid, ms: number) {
  raid.roundMsLeft = Math.max(0, raid.roundMsLeft - ms)
}

export const isLinked = (raid: Raid): boolean => raid.remote?.roomId != null

/** Esperando la respuesta del servidor para entrar en una de sus salas (si falla o no la hay, se juega en local) */
export const isSearching = (raid: Raid): boolean => raid.remote?.roomId === null

/**
 * Al caer el jefe: tira el premio de cada Pokémon del jugador que cobra y los que siguen dentro salen de la sala.
 * Devuelve los premios; cada clase de sala decide qué hace con ellos
 */
export function settleFall(s: GameState, raid: Raid, rng: Rng): RaidPrize[] {
  const earners = raid.members.filter((m) => m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs))
  const prizes = earners.map((m) => rollPrize(raid.boss, m.id, rng))
  for (const m of playerMembers(raid)) removePlayer(s, m)
  return prizes
}
