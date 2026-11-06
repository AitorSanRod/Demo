import { route, type Route, type RouteNode } from '../../data/maps'
import type { Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { completeRoute, faint } from '../run/runBattle'
import { maxHp } from '../team/stats'
import { addPlayer, isLinked, isSearching, localHooks, passivesOf, playerMembers, removePlayer, runLinkedClock, settleFall } from './raidEngine'
import { beginEnding, isEnding, spendEnding } from './raidEnding'
import { applyPrize } from './raidPrizes'
import { pendingLink, type Raid, type RaidPlace, type RaidPrize } from './raidRoom'
import { recordRouteRaidFall, routeRaidMoneyMult } from './routeRaidStreak'
import { advanceStopRoom, ROUTE_RAID_JOIN_MIN_HP, stopRoom } from './stopRoom'

// Jefes comunitarios de las paradas de ruta (NodeKind.Raid): el Pokémon de la ruta llega, entra en una sala de esa
// parada y lucha hasta que cae el jefe o gasta sus vidas (entonces vuelve al principio de la ruta y, al llegar otra vez,
// se reengancha a una pelea parecida); los que llegan después se unen hasta llenarla. Su premio es parte del de la
// ruta (sale en su resumen), no de la pestaña Raids.

/** Probabilidad, al llegar sin servidor, de encontrar ya una sala en marcha en la parada */
export const ROUTE_RAID_RUNNING_CHANCE = 0.5
/**
 * Milisegundos de juego que la parada puede esperar sitio en el servidor de una vez. Con la app delante se piden en
 * segundos; un salto mayor es tiempo con la app cerrada u oculta, en el que nadie lo ha pedido: se juega en local
 */
export const ROUTE_RAID_SEARCH_MS = 10_000
/** Veces que puede caer el Pokémon contra el jefe de la parada; al gastarlas vuelve al principio de la ruta */
export const ROUTE_RAID_LIVES = 10

/** Vida al azar (fracción de la total) del jefe de una sala en marcha; 1 − rng() está en (0, 1]: nunca por debajo del mínimo */
const randomJoinHp = (rng: Rng) => ROUTE_RAID_JOIN_MIN_HP + (1 - rng()) * (1 - ROUTE_RAID_JOIN_MIN_HP)

/**
 * Vida del jefe de la sala en marcha a la que llega el Pokémon: si vuelve tras gastar sus vidas, la que dejó; si no,
 * a veces una al azar. null: sala nueva
 */
function arrivalHp(s: GameState, rng: Rng): number | null {
  const rejoin = s.run!.raidRejoinHp
  if (rejoin !== null) return rejoin
  return rng() < ROUTE_RAID_RUNNING_CHANCE ? randomJoinHp(rng) : null
}

/**
 * Al llegar a la parada: la ruta se para y el Pokémon entra, con ROUTE_RAID_LIVES vidas, en una sala ya en marcha o en
 * una nueva. Antes busca sitio en una sala compartida del servidor, que da preferencia a las que tienen jugadores (ver
 * online/linkedRoom.ts); mientras, la sala local espera quieta, y solo si no hay servidor se lucha en ella con bots
 */
export function enterRouteRaid(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  const place: RaidPlace = { routeId: r.id, nodeId: n.id }
  const hp = arrivalHp(s, rng)
  run.raid = stopRoom(n, place, hp, rng, passivesOf(s))
  run.raid.remote = pendingLink(hp)
  run.raidRejoinHp = null
  addPlayer(s, run.raid, activeMon(s)!, ROUTE_RAID_LIVES)
  run.phase = 'raid'
}

/** Sala de parada en la que está luchando ahora el Pokémon de la ruta */
export const currentRouteRaid = (s: GameState): Raid | null => (s.run?.phase === 'raid' ? s.run.raid : null)

/** Retirarse cuenta como derrota: la ruta acaba sin completarse y sin el premio del jefe */
export function retreatRouteRaid(s: GameState) {
  const raid = currentRouteRaid(s)
  if (!raid || isEnding(raid)) return
  for (const m of playerMembers(raid)) removePlayer(s, m)
  if (raid.remote?.roomId) s.roomsToLeave.push(raid.remote.roomId)
  s.run!.raid = null
  faint(s)
}

/** El premio del jefe (su EXP, para el Pokémon de la ruta) se suma a la partida y a lo ganado en la ruta */
function earnPrize(s: GameState, p: RaidPrize) {
  const earned = s.run!.earned
  earned.levelsGained += applyPrize(s, p)
  earned.exp += p.exp
  earned.money += p.money
  earned.tickets += p.tickets
  earned.pieces.push(...Array<number>(p.pieces).fill(p.bossSpeciesId))
  earned.raidBosses.push(p.bossSpeciesId)
}

/**
 * Al caer el jefe: cuenta como victoria, su premio (con el dinero y la EXP rebajados si se repite seguido) va a lo ganado en la
 * ruta y la ruta sigue o, si era la última parada, se completa
 */
export function finishRouteRaid(s: GameState, raid: Raid, rng: Rng) {
  const run = s.run!
  const mult = routeRaidMoneyMult(s, raid.place!, s.lastTick)
  for (const p of settleFall(s, raid, rng)) earnPrize(s, { ...p, money: Math.round(p.money * mult), exp: Math.round(p.exp * mult) })
  recordRouteRaidFall(s, raid.place!, s.lastTick)
  run.earned.raidMoneyMult = Math.min(run.earned.raidMoneyMult, mult)
  run.earned.battles++
  run.earned.wins++
  run.raid = null
  if (run.stop === run.path.length - 1) completeRoute(s, route(run.routeId))
  else run.phase = 'walking'
}

/**
 * Al gastar sus vidas el Pokémon sale de la sala, se recupera y vuelve al principio de la ruta (conserva lo ganado);
 * se recuerda la vida del jefe para reengancharse a una pelea parecida al llegar otra vez a la parada
 */
export function startOver(s: GameState, raid: Raid) {
  for (const m of playerMembers(raid)) removePlayer(s, m)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  Object.assign(s.run!, { raid: null, raidRejoinHp: raid.hp / raid.maxHp, stop: 0, steps: 0, phase: 'walking', lastBattle: null, battleMsLeft: 0 })
}

/** La pelea se ha parado (o ha caído el jefe o el Pokémon ha gastado sus vidas) y ya se ha visto su final */
const endFight = (s: GameState, raid: Raid, rng: Rng) => (raid.hp === 0 ? finishRouteRaid(s, raid, rng) : startOver(s, raid))

/**
 * Avanza la pelea de la parada `ms` milisegundos de juego y devuelve los que ha gastado (menos si la pelea acaba
 * antes: el resto es para seguir la ruta). Si la sala es del servidor, allí se juega. Mientras se busca sala en él, la
 * pelea espera (antes de una sala con bots se mira si hay una con jugadores), salvo que el salto sea mayor que
 * ROUTE_RAID_SEARCH_MS: entonces la app no estaba para buscarla y la sala se juega en local. Cuando la pelea se para, se
 * ve su final (raidEnding.ts) antes de seguir la ruta
 */
export function advanceRouteRaid(s: GameState, ms: number, rng: Rng = Math.random): number {
  const raid = currentRouteRaid(s)
  if (!raid) return 0
  if (isEnding(raid)) return spendRouteEnding(s, raid, ms, rng)
  if (isSearching(raid)) {
    if (ms <= ROUTE_RAID_SEARCH_MS) return ms
    raid.remote = null
  }
  if (isLinked(raid)) {
    runLinkedClock(raid, ms)
    return ms
  }
  const left = advanceStopRoom(raid, ms, rng, localHooks(s))
  if (left === null) return ms
  beginEnding(raid)
  return ms - left + spendRouteEnding(s, raid, left, rng)
}

/** Gasta el final de la pelea; al terminar, aplica el resultado. Devuelve los milisegundos gastados */
function spendRouteEnding(s: GameState, raid: Raid, ms: number, rng: Rng): number {
  const left = spendEnding(raid, ms)
  if (left === null) return ms
  endFight(s, raid, rng)
  return ms - left
}
