import type { RouteNode } from '../../data/maps'
import type { RaidBoss } from '../../data/raidBosses'
import { randInt, type Rng } from '../core/random'
import { RAID_ROUND_MS, type PassivesOf } from './raidCombat'
import { addBot, type BotPolicy } from './raidBots'
import { advanceRoom, newRaid, type RoomHooks } from './raidEngine'
import { raidDamagePerRound } from './raidEstimate'
import { RAID_ROOM_SIZE, type Raid, type RaidPlace } from './raidRoom'

// Las salas de una parada de jefe comunitario (NodeKind.Raid) por sí mismas, sin la partida: cómo se abren y cómo
// avanzan. Las usan la ruta del jugador (routeRaid.ts) y el servidor (online/sharedRoom.ts).

/** Bots de una sala de parada: no hay mínimo; van llegando (como si acabaran la ruta), uno cada ≈40 s, hasta llenarla */
const ROUTE_RAID_BOTS: BotPolicy = { min: 0, max: RAID_ROOM_SIZE - 1, joinPerMinute: 1.5 }
/** Milisegundos de juego tras abrir una sala nueva en los que entra el primer bot (luego, al ritmo de ROUTE_RAID_BOTS) */
export const ROUTE_RAID_FIRST_BOT_MS = 5_000
/** Vida mínima del jefe (fracción de la total) para poder entrar en una sala en marcha; si no, se abre otra */
export const ROUTE_RAID_JOIN_MIN_HP = 0.25

/** Jefe comunitario de la parada; el mapa obliga a que tenga categoría de premios (ver maps.test.ts) */
function stopBoss(n: RouteNode): RaidBoss {
  const { boss } = n
  if (!boss?.tier) throw new Error(`La parada ${n.id} no tiene jefe comunitario con categoría de premios`)
  return { ...boss, tier: boss.tier }
}

/**
 * Sala que lleva un rato en marcha cuando llega el jugador: unos bots dentro y el jefe tocado, con la vida más cercana
 * a `hpFraction` que permite unirse. El tiempo que llevan es el que habrían tardado en quitarle esa vida al ritmo de la sala
 */
function runningRoom(n: RouteNode, place: RaidPlace, hpFraction: number, rng: Rng, passives: PassivesOf): Raid {
  const raid = newRaid(stopBoss(n), place)
  const bots = randInt(1, RAID_ROOM_SIZE - 2, rng)
  for (let i = 0; i < bots; i++) addBot(raid, rng)
  const minHp = Math.floor(raid.maxHp * ROUTE_RAID_JOIN_MIN_HP) + 1
  raid.hp = Math.min(raid.maxHp, Math.max(minHp, Math.round(raid.maxHp * hpFraction)))
  const perRound = raidDamagePerRound(raid, passives)
  raid.elapsedMs = perRound > 0 ? Math.round((raid.maxHp - raid.hp) / perRound) * RAID_ROUND_MS : 0
  for (const m of raid.members) m.presentMs = raid.elapsedMs
  return raid
}

/** Sala de la parada: con `hpFraction`, una en marcha con el jefe a esa vida; con null, una nueva y vacía */
export const stopRoom = (n: RouteNode, place: RaidPlace, hpFraction: number | null, rng: Rng, passives: PassivesOf): Raid =>
  hpFraction === null ? newRaid(stopBoss(n), place) : runningRoom(n, place, hpFraction, rng, passives)

/** Milisegundos de juego que lleva la pelea en la sala, contando lo que va de la ronda en curso */
const fightMs = (raid: Raid) => raid.elapsedMs + RAID_ROUND_MS - raid.roundMsLeft

/**
 * Avanza la sala `ms` milisegundos de juego, como `advanceRoom`. En una sala a la que aún no ha llegado nadie, el primer
 * bot entra justo a los ROUTE_RAID_FIRST_BOT_MS (se para el avance en ese momento, aunque sea a mitad de ronda)
 */
export function advanceStopRoom(raid: Raid, ms: number, rng: Rng, hooks: RoomHooks): number | null {
  const firstBotIn = ROUTE_RAID_FIRST_BOT_MS - fightMs(raid)
  if (raid.nextBotId > 0 || firstBotIn < 0 || firstBotIn >= ms) return advanceRoom(raid, ms, ROUTE_RAID_BOTS, rng, hooks)
  const left = advanceRoom(raid, firstBotIn, ROUTE_RAID_BOTS, rng, hooks)
  if (left !== null) return left + ms - firstBotIn
  addBot(raid, rng)
  return advanceRoom(raid, ms - firstBotIn, ROUTE_RAID_BOTS, rng, hooks)
}
