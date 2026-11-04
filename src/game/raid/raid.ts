import { RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { RAID_BOTS } from './raidBots'
import { addPlayer, advanceRoom, newRaid, playerMembers, removePlayer, settleFall } from './raidEngine'
import { hasRoom, presentMembers, type Raid } from './raidRoom'

// El jefe de la pestaña Raids: siempre hay uno, se manda a un Pokémon del rancho y al caer sale el siguiente.

/** Pokémon del jugador que pueden estar a la vez en la sala */
export const RAID_PLAYER_SLOTS = 1

export const raidBossAt = (felled: number): RaidBoss => RAID_BOSSES[felled % RAID_BOSSES.length]

/** Hay jefe en cuanto termina el tutorial */
export function ensureRaid(s: GameState) {
  if (!s.raid && s.tutorial === null) s.raid = newRaid(raidBossAt(0), null)
}

export function raidBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!s.raid) return 'Todavía no hay ningún jefe.'
  if (!mon) return 'Ese Pokémon no existe.'
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede ir desde el rancho.'
  if (playerMembers(s.raid).length >= RAID_PLAYER_SLOTS) return 'Ya tienes un Pokémon luchando contra el jefe.'
  if (!hasRoom(s.raid)) return 'La sala está llena.'
  const minLevel = s.raid.boss.minLevel ?? 0
  if (mon.level < minLevel) return `Hace falta Nv. ${minLevel} para luchar contra este jefe.`
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

/** Manda al Pokémon a la sala; si ya estuvo contra este jefe, conserva su tiempo y su daño */
export function joinRaid(s: GameState, uid: string) {
  if (!raidBlocker(s, uid)) addPlayer(s, s.raid!, findMon(s, uid)!)
}

/** Retirada antes de tiempo; si ya cumple el mínimo de presencia, cobrará cuando caiga el jefe */
export function leaveRaid(s: GameState, uid: string) {
  const m = s.raid && playerMembers(s.raid).find((x) => x.id === uid)
  if (m) removePlayer(s, m)
}

/**
 * Al caer: el premio queda pendiente en la pestaña, los Pokémon del jugador vuelven al rancho y sale el siguiente jefe
 * con los bots que siguen dentro
 */
function fall(s: GameState, raid: Raid, rng: Rng) {
  s.raidPrizes.push(...settleFall(s, raid, rng))
  s.raid = newRaid(raidBossAt(raid.felled + 1), null, { felled: raid.felled + 1, stayers: presentMembers(raid), nextBotId: raid.nextBotId })
}

/** Avanza la pelea `ms` milisegundos de juego; si cae el jefe, el tiempo que sobra lo juega el siguiente */
export function advanceRaid(s: GameState, ms: number, rng: Rng = Math.random) {
  ensureRaid(s)
  let left: number | null = ms
  while (s.raid && left !== null) {
    left = advanceRoom(s, s.raid, left, RAID_BOTS, rng)
    if (left !== null) fall(s, s.raid, rng)
  }
}
