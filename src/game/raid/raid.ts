import { RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { RAID_BOTS } from './raidBots'
import { addPlayer, advanceRoom, isLinked, localHooks, newRaid, playerMembers, removePlayer, runLinkedClock, settleFall } from './raidEngine'
import { hasRoom, pendingLink, type Raid } from './raidRoom'

// El jefe de la pestaña Raids: siempre hay uno, se manda a un Pokémon del rancho y al caer sale el siguiente.

/** Pokémon del jugador que pueden estar a la vez en la sala */
export const RAID_PLAYER_SLOTS = 1
/** Milisegundos de juego que tarda en aparecer el siguiente jefe tras caer uno */
export const RAID_COOLDOWN_MS = 15 * 60_000

/** El jefe ya ha caído y el siguiente aún no ha aparecido */
export const raidWaiting = (raid: Raid): boolean => raid.startsInMs > 0

export const raidBossAt = (felled: number): RaidBoss => RAID_BOSSES[felled % RAID_BOSSES.length]

/** Hay jefe en cuanto termina el tutorial */
export function ensureRaid(s: GameState) {
  if (!s.raid && s.tutorial === null) s.raid = newRaid(raidBossAt(0), null)
}

export function raidBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!s.raid) return 'Todavía no hay ningún jefe.'
  if (raidWaiting(s.raid)) return 'El siguiente jefe aún no ha aparecido.'
  if (!mon) return 'Ese Pokémon no existe.'
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede ir desde el rancho.'
  if (playerMembers(s.raid).length >= RAID_PLAYER_SLOTS) return 'Ya tienes un Pokémon luchando contra el jefe.'
  if (!hasRoom(s.raid)) return 'La sala está llena.'
  const minLevel = s.raid.boss.minLevel ?? 0
  if (mon.level < minLevel) return `Hace falta Nv. ${minLevel} para luchar contra este jefe.`
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

/**
 * Manda al Pokémon a la sala; si ya estuvo contra este jefe, conserva su tiempo y su daño. Una sala solo local pasa a
 * esperar sitio en una compartida del servidor (ver online/linkedRoom.ts); mientras, sigue la pelea aquí
 */
export function joinRaid(s: GameState, uid: string) {
  if (raidBlocker(s, uid)) return
  addPlayer(s, s.raid!, findMon(s, uid)!)
  s.raid!.remote ??= pendingLink()
}

/** Retirada antes de tiempo; si ya cumple el mínimo de presencia, cobrará cuando caiga el jefe */
export function leaveRaid(s: GameState, uid: string) {
  const m = s.raid && playerMembers(s.raid).find((x) => x.id === uid)
  if (!m) return
  removePlayer(s, m)
  // Si aún estaba entrando en una sala del servidor, ya no hace falta
  if (s.raid!.remote?.roomId === null) s.raid!.remote = null
}

/**
 * Al caer: el premio queda pendiente en la pestaña, los Pokémon del jugador vuelven al rancho, la sala se vacía y el
 * siguiente jefe aparece pasado RAID_COOLDOWN_MS
 */
export function fallTabRaid(s: GameState, raid: Raid, rng: Rng) {
  s.raidPrizes.push(...settleFall(s, raid, rng))
  s.raid = newRaid(raidBossAt(raid.felled + 1), null, { felled: raid.felled + 1, nextBotId: raid.nextBotId, startsInMs: RAID_COOLDOWN_MS })
}

/** Gasta en la espera del jefe lo que haga falta de `ms`; devuelve lo que sobra */
function waitForBoss(raid: Raid, ms: number): number {
  const waited = Math.min(ms, raid.startsInMs)
  raid.startsInMs -= waited
  return ms - waited
}

/** Avanza la pelea `ms` milisegundos de juego; si cae el jefe, el tiempo que sobra cuenta para la espera y el siguiente */
export function advanceRaid(s: GameState, ms: number, rng: Rng = Math.random) {
  ensureRaid(s)
  let left: number | null = ms
  if (s.raid && isLinked(s.raid)) return runLinkedClock(s.raid, ms)
  while (s.raid && left !== null) {
    left = advanceRoom(s.raid, waitForBoss(s.raid, left), RAID_BOTS, rng, localHooks(s))
    if (left !== null) fallTabRaid(s, s.raid, rng)
  }
}
