import { RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { RAID_ROTATIONS, RaidRotation, roomRotation } from './online/protocol'
import { RAID_BOTS } from './raidBots'
import { addPlayer, advanceRoom, isLinked, localHooks, newRaid, playerMembers, removePlayer, runLinkedClock, settleFall } from './raidEngine'
import { beginEnding, isEnding, spendEnding } from './raidEnding'
import { hasRoom, pendingLink, presentMembers, RaidMemberKind, type Raid } from './raidRoom'

// Los jefes de la pestaña Raids: hay uno por rotación (online/protocol.ts), se manda a un Pokémon del rancho a cada uno
// y al caer sale el siguiente. Con servidor (GameState.raidServer), los jefes y las salas los decide él
// (online/raidCycle.ts) y aquí solo viven las salas en las que hay un Pokémon del jugador; sin servidor, solo la
// rotación ordenada, en local y con bots.

/** Pokémon del jugador que pueden estar a la vez en la sala de una rotación */
const RAID_PLAYER_SLOTS = 1
/** Milisegundos de juego que tarda en aparecer el siguiente jefe tras caer uno */
export const RAID_COOLDOWN_MS = 15 * 60_000
/** La rotación que se juega sin servidor */
export const LOCAL_ROTATION: RaidRotation = RaidRotation.Ordered

/** El jefe ya ha caído y el siguiente aún no ha aparecido */
export const raidWaiting = (raid: Raid): boolean => raid.startsInMs > 0

export const raidBossAt = (felled: number): RaidBoss => RAID_BOSSES[felled % RAID_BOSSES.length]

/** Sin servidor, hay jefe en cuanto termina el tutorial; con servidor, lo pone él */
export function ensureRaid(s: GameState) {
  if (!s.raids[LOCAL_ROTATION] && s.tutorial === null && !s.raidServer) s.raids[LOCAL_ROTATION] = newRaid(raidBossAt(0), null)
}

/** Las rotaciones con una sala en la partida */
export const tabRaidRotations = (s: GameState): RaidRotation[] => RAID_ROTATIONS.filter((r) => s.raids[r])

/** La rotación en cuya sala está luchando ese Pokémon; null si no está en ninguna */
export const raidRotationOf = (s: GameState, uid: string): RaidRotation | null =>
  tabRaidRotations(s).find((r) => playerMembers(s.raids[r]!).some((m) => m.id === uid)) ?? null

/** Cabe en la sala: hay hueco o (en una del servidor) un bot al que echar */
const roomFor = (s: GameState, raid: Raid) => hasRoom(raid) || (s.raidServer && presentMembers(raid).some((m) => m.kind === RaidMemberKind.Bot))

/**
 * Por qué no puede ir ningún Pokémon contra el jefe de `raid` (por defecto, la sala de la partida en esa rotación);
 * null si se puede entrar
 */
export function raidRoomBlocker(s: GameState, rotation: RaidRotation, raid: Raid | null = s.raids[rotation]): string | null {
  if (!raid) return 'Todavía no hay ningún jefe.'
  if (raidWaiting(raid)) return 'El siguiente jefe aún no ha aparecido.'
  const own = s.raids[rotation]
  if (own && playerMembers(own).length >= RAID_PLAYER_SLOTS) return 'Ya tienes un Pokémon luchando contra este jefe.'
  if (!roomFor(s, raid)) return 'La sala está llena.'
  return null
}

/** Por qué no puede ir ese Pokémon contra el jefe de `raid` (sin mirar la sala); null si puede */
export function monRaidBlocker(s: GameState, uid: string, raid: Raid): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede ir desde el rancho.'
  const minLevel = raid.boss.minLevel ?? 0
  if (mon.level < minLevel) return `Hace falta Nv. ${minLevel} para luchar contra este jefe.`
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

/** Por qué no puede ir ese Pokémon contra el jefe de la rotación (por defecto, el de su sala en la partida); null si puede */
export function raidBlocker(s: GameState, uid: string, rotation: RaidRotation, raid: Raid | null = s.raids[rotation]): string | null {
  return raidRoomBlocker(s, rotation, raid) ?? monRaidBlocker(s, uid, raid!)
}

/**
 * Sin servidor: manda al Pokémon a la sala local; si ya estuvo contra este jefe, conserva su tiempo y su daño. La sala
 * pasa a esperar sitio en una compartida del servidor (ver online/linkedRoom.ts); mientras, sigue la pelea aquí
 */
export function joinRaid(s: GameState, uid: string) {
  if (raidBlocker(s, uid, LOCAL_ROTATION)) return
  const raid = s.raids[LOCAL_ROTATION]!
  addPlayer(s, raid, findMon(s, uid)!)
  raid.remote ??= pendingLink()
}

/**
 * Con servidor: manda al Pokémon a la sala que se está viendo (`roomId`: la del frontal o una de la lista). La sala
 * pasa a ser la de la partida en su rotación, esperando sitio en el servidor (ver online/linkedRoom.ts)
 */
export function joinServerRaid(s: GameState, uid: string, room: Raid, roomId: string) {
  const rotation = roomRotation(roomId)
  if (raidBlocker(s, uid, rotation, room)) return
  const raid: Raid = { ...structuredClone(room), remote: pendingLink(null, roomId) }
  s.raids[rotation] = raid
  addPlayer(s, raid, findMon(s, uid)!)
}

/**
 * Hay servidor: la pestaña Raids pasa a ser suya. Las salas locales de muestra se dejan (salvo las que tienen dentro un
 * Pokémon del jugador: esas peleas acaban aquí)
 */
export function switchToServerRaids(s: GameState) {
  s.raidServer = true
  for (const r of tabRaidRotations(s)) {
    const raid = s.raids[r]!
    if (!raid.remote && playerMembers(raid).length === 0) s.raids[r] = null
  }
}

/** No hay servidor: la pestaña Raids se juega en local, con bots */
export function switchToLocalRaids(s: GameState) {
  s.raidServer = false
}

/** Retirada antes de tiempo; si ya cumple el mínimo de presencia, cobrará cuando caiga el jefe */
export function leaveRaid(s: GameState, uid: string) {
  const rotation = raidRotationOf(s, uid)
  if (!rotation || isEnding(s.raids[rotation]!)) return
  const raid = s.raids[rotation]!
  removePlayer(s, playerMembers(raid).find((m) => m.id === uid)!)
  // Si aún estaba entrando en una sala del servidor, ya no hace falta
  if (raid.remote?.roomId === null) raid.remote = null
}

/**
 * Al caer: el premio queda pendiente en la pestaña, los Pokémon del jugador vuelven al rancho, la sala se vacía y,
 * sin servidor, el siguiente jefe aparece pasado RAID_COOLDOWN_MS
 */
export function fallTabRaid(s: GameState, rotation: RaidRotation, raid: Raid, rng: Rng) {
  s.raidPrizes.push(...settleFall(s, raid, rng))
  // Con servidor, el siguiente jefe lo pone él (y la espera es la misma para todos)
  if (s.raidServer || rotation !== LOCAL_ROTATION) s.raids[rotation] = null
  else s.raids[rotation] = newRaid(raidBossAt(raid.felled + 1), null, { felled: raid.felled + 1, nextBotId: raid.nextBotId, startsInMs: RAID_COOLDOWN_MS })
}

/** Gasta en la espera del jefe lo que haga falta de `ms`; devuelve lo que sobra */
function waitForBoss(raid: Raid, ms: number): number {
  const waited = Math.min(ms, raid.startsInMs)
  raid.startsInMs -= waited
  return ms - waited
}

/** Avanza `ms` la sala de una rotación; la enlazada al servidor solo cuenta su reloj (la pelea la juega él). Al caer el jefe, se ve el final */
function advanceTabRaid(s: GameState, rotation: RaidRotation, ms: number, rng: Rng) {
  const raid = s.raids[rotation]
  if (!raid) return
  if (isEnding(raid)) return finishTabEnding(s, rotation, raid, ms, rng)
  if (isLinked(raid) || (s.raidServer && raid.remote)) return runLinkedClock(raid, ms)
  // Con servidor y sin un Pokémon propio dentro, la sala que se ve es la del servidor: aquí no se juega nada
  if (s.raidServer && playerMembers(raid).length === 0) {
    s.raids[rotation] = null
    return
  }
  const left = advanceRoom(raid, waitForBoss(raid, ms), RAID_BOTS, rng, localHooks(s))
  if (left === null) return
  beginEnding(raid)
  finishTabEnding(s, rotation, raid, left, rng)
}

/** Gasta el final de la pelea; al terminar cae el jefe y lo que sobra cuenta para la espera y el siguiente */
function finishTabEnding(s: GameState, rotation: RaidRotation, raid: Raid, ms: number, rng: Rng) {
  const left = spendEnding(raid, ms)
  if (left === null) return
  fallTabRaid(s, rotation, raid, rng)
  if (left > 0) advanceTabRaid(s, rotation, left, rng)
}

/** Avanza las peleas `ms` milisegundos de juego; si cae un jefe, el tiempo que sobra cuenta para la espera y el siguiente */
export function advanceRaid(s: GameState, ms: number, rng: Rng = Math.random) {
  ensureRaid(s)
  for (const rotation of RAID_ROTATIONS) advanceTabRaid(s, rotation, ms, rng)
}
