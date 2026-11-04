import { route, type Route, type RouteNode } from '../../data/maps'
import type { RaidBoss } from '../../data/raidBosses'
import { randInt, type Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { completeRoute, faint } from '../run/runBattle'
import { maxHp } from '../team/stats'
import { RAID_ROUND_MS } from './raidCombat'
import { addBot, type BotPolicy } from './raidBots'
import { addPlayer, advanceRoom, newRaid, passivesOf, playerMembers, removePlayer, settleFall } from './raidEngine'
import { raidDamagePerRound } from './raidEstimate'
import { applyPrize } from './raidPrizes'
import { RAID_ROOM_SIZE, type Raid, type RaidPlace, type RaidPrize } from './raidRoom'

// Jefes comunitarios de las paradas de ruta (NodeKind.Raid): el Pokémon de la ruta llega, entra en una sala de esa
// parada y lucha hasta que cae el jefe o gasta sus vidas (entonces vuelve al principio de la ruta y, al llegar otra vez,
// se reengancha a una pelea parecida); los que llegan después se unen hasta llenarla. Su premio es parte del de la
// ruta (sale en su resumen), no de la pestaña Raids.

/** Bots de una sala de parada: no hay mínimo; van llegando (como si acabaran la ruta), uno cada ≈40 s, hasta llenarla */
export const ROUTE_RAID_BOTS: BotPolicy = { min: 0, max: RAID_ROOM_SIZE - 1, joinPerMinute: 1.5 }
/** Milisegundos de juego tras abrir una sala nueva en los que entra el primer bot (luego, al ritmo de ROUTE_RAID_BOTS) */
export const ROUTE_RAID_FIRST_BOT_MS = 5_000
/** Probabilidad, al llegar, de encontrar ya una sala en marcha en la parada (mientras no haya servidor) */
export const ROUTE_RAID_RUNNING_CHANCE = 0.5
/** Vida mínima del jefe (fracción de la total) para poder entrar en una sala en marcha; si no, se abre otra */
export const ROUTE_RAID_JOIN_MIN_HP = 0.25
/** Veces que puede caer el Pokémon contra el jefe de la parada; al gastarlas vuelve al principio de la ruta */
export const ROUTE_RAID_LIVES = 10

/** Jefe comunitario de la parada; el mapa obliga a que tenga categoría de premios (ver maps.test.ts) */
function stopBoss(n: RouteNode): RaidBoss {
  const { boss } = n
  if (!boss?.tier) throw new Error(`La parada ${n.id} no tiene jefe comunitario con categoría de premios`)
  return { ...boss, tier: boss.tier }
}

/** Vida al azar (fracción de la total) del jefe de una sala en marcha; 1 − rng() está en (0, 1]: nunca por debajo del mínimo */
const randomJoinHp = (rng: Rng) => ROUTE_RAID_JOIN_MIN_HP + (1 - rng()) * (1 - ROUTE_RAID_JOIN_MIN_HP)

/**
 * Sala que lleva un rato en marcha cuando llega el jugador: unos bots dentro y el jefe tocado, con la vida más cercana
 * a `hpFraction` que permite unirse. El tiempo que llevan es el que habrían tardado en quitarle esa vida al ritmo de la sala
 */
function runningRoom(s: GameState, n: RouteNode, place: RaidPlace, hpFraction: number, rng: Rng): Raid {
  const raid = newRaid(stopBoss(n), place)
  const bots = randInt(1, RAID_ROOM_SIZE - 2, rng)
  for (let i = 0; i < bots; i++) addBot(raid, rng)
  const minHp = Math.floor(raid.maxHp * ROUTE_RAID_JOIN_MIN_HP) + 1
  raid.hp = Math.min(raid.maxHp, Math.max(minHp, Math.round(raid.maxHp * hpFraction)))
  const perRound = raidDamagePerRound(raid, passivesOf(s))
  raid.elapsedMs = perRound > 0 ? Math.round((raid.maxHp - raid.hp) / perRound) * RAID_ROUND_MS : 0
  for (const m of raid.members) m.presentMs = raid.elapsedMs
  return raid
}

/** Sala a la que llega el Pokémon: si vuelve tras gastar sus vidas, una en marcha con el jefe como lo dejó; si no, al azar */
function arrivalRoom(s: GameState, n: RouteNode, place: RaidPlace, rng: Rng): Raid {
  const rejoin = s.run!.raidRejoinHp
  if (rejoin !== null) return runningRoom(s, n, place, rejoin, rng)
  return rng() < ROUTE_RAID_RUNNING_CHANCE ? runningRoom(s, n, place, randomJoinHp(rng), rng) : newRaid(stopBoss(n), place)
}

/** Al llegar a la parada: la ruta se para y el Pokémon entra, con ROUTE_RAID_LIVES vidas, en una sala ya en marcha o en una nueva */
export function enterRouteRaid(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  run.raid = arrivalRoom(s, n, { routeId: r.id, nodeId: n.id }, rng)
  run.raidRejoinHp = null
  addPlayer(s, run.raid, activeMon(s)!, ROUTE_RAID_LIVES)
  run.phase = 'raid'
}

/** Sala de parada en la que está luchando ahora el Pokémon de la ruta */
export const currentRouteRaid = (s: GameState): Raid | null => (s.run?.phase === 'raid' ? s.run.raid : null)

/** Retirarse cuenta como derrota: la ruta acaba sin completarse y sin el premio del jefe */
export function retreatRouteRaid(s: GameState) {
  const raid = currentRouteRaid(s)
  if (!raid) return
  for (const m of playerMembers(raid)) removePlayer(s, m)
  s.run!.raid = null
  faint(s)
}

/** El premio del jefe se suma a la partida y a lo ganado en la ruta */
function earnPrize(s: GameState, p: RaidPrize) {
  const earned = s.run!.earned
  applyPrize(s, p)
  earned.money += p.money
  earned.tickets += p.tickets
  earned.pieces.push(...Array<number>(p.pieces).fill(p.bossSpeciesId))
  earned.raidBosses.push(p.bossSpeciesId)
}

/** Al caer el jefe: su premio va a lo ganado en la ruta y la ruta sigue o, si era la última parada, se completa */
function finishRouteRaid(s: GameState, raid: Raid, rng: Rng) {
  for (const p of settleFall(s, raid, rng)) earnPrize(s, p)
  const run = s.run!
  run.raid = null
  if (run.stop === run.path.length - 1) completeRoute(s, route(run.routeId))
  else run.phase = 'walking'
}

/**
 * Al gastar sus vidas el Pokémon sale de la sala, se recupera y vuelve al principio de la ruta (conserva lo ganado);
 * se recuerda la vida del jefe para reengancharse a una pelea parecida al llegar otra vez a la parada
 */
function startOver(s: GameState, raid: Raid) {
  for (const m of playerMembers(raid)) removePlayer(s, m)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  Object.assign(s.run!, { raid: null, raidRejoinHp: raid.hp / raid.maxHp, stop: 0, steps: 0, phase: 'walking', lastBattle: null, battleMsLeft: 0 })
}

/** La pelea se ha parado: o ha caído el jefe o el Pokémon ha gastado sus vidas */
const endFight = (s: GameState, raid: Raid, rng: Rng) => (raid.hp === 0 ? finishRouteRaid(s, raid, rng) : startOver(s, raid))

/** Milisegundos de juego que lleva la pelea en la sala, contando lo que va de la ronda en curso */
const fightMs = (raid: Raid) => raid.elapsedMs + RAID_ROUND_MS - raid.roundMsLeft

/**
 * Avanza la pelea de la parada `ms` milisegundos de juego. En una sala a la que aún no ha llegado nadie, el primer bot
 * entra justo a los ROUTE_RAID_FIRST_BOT_MS (se para el avance en ese momento, aunque sea a mitad de ronda)
 */
export function advanceRouteRaid(s: GameState, ms: number, rng: Rng = Math.random) {
  const raid = currentRouteRaid(s)
  if (!raid) return
  const firstBotIn = ROUTE_RAID_FIRST_BOT_MS - fightMs(raid)
  const firstBotNow = raid.nextBotId === 0 && firstBotIn >= 0 && firstBotIn < ms
  if (firstBotNow) {
    if (advanceRoom(s, raid, firstBotIn, ROUTE_RAID_BOTS, rng) !== null) return endFight(s, raid, rng)
    addBot(raid, rng)
  }
  if (advanceRoom(s, raid, firstBotNow ? ms - firstBotIn : ms, ROUTE_RAID_BOTS, rng) !== null) endFight(s, raid, rng)
}
