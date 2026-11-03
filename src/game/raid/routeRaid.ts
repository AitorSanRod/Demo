import { route, type Route, type RouteNode } from '../../data/maps'
import { randInt, type Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { completeRoute, faint } from '../run/runBattle'
import { RAID_ROUND_MS } from './raidCombat'
import { addBot, type BotPolicy } from './raidBots'
import { addPlayer, advanceRoom, newRaid, passivesOf, playerMembers, removePlayer, settleFall } from './raidEngine'
import { raidDamagePerRound } from './raidEstimate'
import { applyPrize } from './raidPrizes'
import { RAID_ROOM_SIZE, type Raid, type RaidPlace, type RaidPrize } from './raidRoom'

// Jefes comunitarios de las paradas de ruta (NodeKind.Raid): el Pokémon de la ruta llega, entra en una sala de esa
// parada y lucha hasta que cae el jefe; los que llegan después se unen hasta llenarla. Su premio es parte del de la
// ruta (sale en su resumen), no de la pestaña Jefes.

/** Bots de una sala de parada: no hay mínimo; van llegando (como si acabaran la ruta), uno cada ≈40 s, hasta llenarla */
export const ROUTE_RAID_BOTS: BotPolicy = { min: 0, max: RAID_ROOM_SIZE - 1, joinPerMinute: 1.5 }
/** Milisegundos de juego tras abrir una sala nueva en los que entra el primer bot (luego, al ritmo de ROUTE_RAID_BOTS) */
export const ROUTE_RAID_FIRST_BOT_MS = 5_000
/** Probabilidad, al llegar, de encontrar ya una sala en marcha en la parada (mientras no haya servidor) */
export const ROUTE_RAID_RUNNING_CHANCE = 0.5
/** Vida mínima del jefe (fracción de la total) para poder entrar en una sala en marcha; si no, se abre otra */
export const ROUTE_RAID_JOIN_MIN_HP = 0.25

/**
 * Sala que lleva un rato en marcha cuando llega el jugador: unos bots dentro y el jefe tocado, con vida por encima del
 * mínimo para unirse. El tiempo que llevan es el que habrían tardado en quitarle esa vida al ritmo de la sala
 */
function runningRoom(s: GameState, n: RouteNode, place: RaidPlace, rng: Rng): Raid {
  const raid = newRaid(n.boss!, place)
  const bots = randInt(1, RAID_ROOM_SIZE - 2, rng)
  for (let i = 0; i < bots; i++) addBot(raid, rng)
  // 1 − rng() está en (0, 1]: la vida queda siempre por encima del mínimo para unirse
  const hpFraction = ROUTE_RAID_JOIN_MIN_HP + (1 - rng()) * (1 - ROUTE_RAID_JOIN_MIN_HP)
  raid.hp = Math.max(Math.floor(raid.maxHp * ROUTE_RAID_JOIN_MIN_HP) + 1, Math.round(raid.maxHp * hpFraction))
  const perRound = raidDamagePerRound(raid, passivesOf(s))
  raid.elapsedMs = perRound > 0 ? Math.round((raid.maxHp - raid.hp) / perRound) * RAID_ROUND_MS : 0
  for (const m of raid.members) m.presentMs = raid.elapsedMs
  return raid
}

/** Al llegar a la parada: la ruta se para y el Pokémon entra en una sala ya en marcha o en una nueva */
export function enterRouteRaid(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  const place = { routeId: r.id, nodeId: n.id }
  run.raid = rng() < ROUTE_RAID_RUNNING_CHANCE ? runningRoom(s, n, place, rng) : newRaid(n.boss!, place)
  addPlayer(s, run.raid, activeMon(s)!)
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
    if (advanceRoom(s, raid, firstBotIn, ROUTE_RAID_BOTS, rng) !== null) return finishRouteRaid(s, raid, rng)
    addBot(raid, rng)
  }
  if (advanceRoom(s, raid, firstBotNow ? ms - firstBotIn : ms, ROUTE_RAID_BOTS, rng) !== null) finishRouteRaid(s, raid, rng)
}
