import { NodeKind, type Boss, type Route, type RouteNode } from '../../data/maps'
import { makeFighter, simulateBattle, type BattleRecord } from '../battle/battle'
import { combineBonus } from '../battle/combatBonus'
import { expReward, moneyReward, pieceReward, ticketReward } from '../battle/rewards'
import { markSeen } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import { pickEncounter, randInt, type Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { ranchPassives } from '../team/ranchPassives'
import { gainExp, maxHp } from '../team/stats'

/** PS (fracción del máximo) que se recuperan tras ganar un combate */
const POST_WIN_HEAL = 0.25
/**
 * Multiplicador de stats de los salvajes. Por debajo de 1 porque el jugador encadena combates sin curarse:
 * el 0.8 (junto con la cura de 0.25) se ajustó para la Ruta 1 a niveles 2–4 (ver docs/diseno.md).
 */
const WILD_STAT_MULT = 0.8
/** Multiplicador de los pokécuartos por derrotar a un jefe (respecto a un salvaje de su nivel) */
export const BOSS_MONEY_MULT = 3
/** Multiplicador de la EXP por derrotar a un jefe (respecto a un salvaje de su nivel) */
export const BOSS_EXP_MULT = 2
/** Tickets que da siempre derrotar a un jefe (en lugar de la probabilidad de un salvaje) */
export const BOSS_TICKETS = 0
/** Fracción del dinero ganado en la ruta que se pierde al ser derrotado */
const DEFEAT_MONEY_LOSS = 0.5
/** Milisegundos reales que dura cada evento del combate en la ruta; mientras, no se avanza */
export const BATTLE_EVENT_MS = 700
/** Milisegundos reales tras el último evento (el rival cae o huye y se ve el premio) antes de seguir caminando */
const BATTLE_END_MS = 1200

export const battleDuration = (b: BattleRecord): number => b.events.length * BATTLE_EVENT_MS + BATTLE_END_MS

/** Rival de la parada: el jefe si lo tiene; si no, un salvaje de sus encuentros al nivel de la ruta */
function rivalOf(r: Route, n: RouteNode, rng: Rng): Boss {
  if (n.boss) return n.boss
  const speciesId = pickEncounter(n.encounters ?? r.encounters, rng)
  return { speciesId, level: randInt(r.levels[0], r.levels[1], rng) + (n.levelBonus ?? 0) }
}

/**
 * Resuelve el combate de la parada pero no lo aplica: PS, premio y derrota se aplican en `settleBattle` cuando
 * termina su tiempo, para que el estado no se adelante a lo que ve el jugador. Los jefes luchan con sus stats
 * completas (sin WILD_STAT_MULT), con sus pasivas del mapa, y dan más premio. El Pokémon del jugador lleva las pasivas
 * de su rancho.
 */
export function startStopBattle(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  const mon = activeMon(s)!
  const isBoss = n.kind === NodeKind.Boss
  const { speciesId: enemyId, level, passives } = rivalOf(r, n, rng)
  const enemy = makeFighter('enemy', enemyId, level, { statMult: isBoss ? 1 : WILD_STAT_MULT, passives })
  const player = makeFighter('player', mon.speciesId, mon.level, {
    hp: Math.floor(mon.hp),
    stars: mon.stars,
    passives: ranchPassives(s, mon.ranch!),
  })
  const result = simulateBattle(player, enemy, rng)
  const win = result.outcome === 'win'
  markSeen(s, enemyId)
  run.earned.battles++
  run.lastBattle = {
    player: { speciesId: mon.speciesId, name: player.name, level: mon.level, maxHp: player.maxHp },
    enemy: { speciesId: enemyId, name: enemy.name, level, maxHp: enemy.maxHp },
    events: result.events,
    outcome: result.outcome,
    boss: isBoss,
    rewards: {
      money: win ? moneyReward(level, rng) * (isBoss ? BOSS_MONEY_MULT : 1) : 0,
      tickets: win ? (isBoss ? BOSS_TICKETS : ticketReward(enemyId, rng)) : 0,
      exp: win ? expReward(level, mon.level) * (isBoss ? BOSS_EXP_MULT : 1) : 0,
      piece: win && pieceReward(enemyId, rng),
      moneyLost: 0,
    },
  }
  run.battleMsLeft = battleDuration(run.lastBattle)
}

/** Gasta hasta `ms` del combate en curso; al acabarse, lo aplica. Devuelve el tiempo gastado. */
export function spendBattleTime(s: GameState, r: Route, ms: number): number {
  const run = s.run!
  const spent = Math.min(ms, run.battleMsLeft)
  run.battleMsLeft -= spent
  if (run.battleMsLeft === 0 && spent > 0) settleBattle(s, r)
  return spent
}

function settleBattle(s: GameState, r: Route) {
  const run = s.run!
  const record = run.lastBattle!
  const mon = activeMon(s)!
  // En combate los PS iban escalados por la pasiva de PS: se vuelven a la escala del Pokémon
  mon.hp = Math.min(maxHp(mon), Math.round((record.events[record.events.length - 1].playerHp * maxHp(mon)) / record.player.maxHp))
  if (record.outcome === 'lose') {
    record.rewards.moneyLost = faint(s)
    return
  }
  if (record.outcome === 'win') {
    const winHeal = POST_WIN_HEAL + combineBonus(ranchPassives(s, mon.ranch!)).winHeal
    mon.hp = Math.min(maxHp(mon), mon.hp + Math.ceil(maxHp(mon) * winHeal))
    s.money += record.rewards.money
    s.tickets += record.rewards.tickets
    run.earned.money += record.rewards.money
    run.earned.tickets += record.rewards.tickets
    gainRunExp(s, record.rewards.exp)
    if (record.rewards.piece) {
      addPieces(s, record.enemy.speciesId, 1)
      run.earned.pieces.push(record.enemy.speciesId)
    }
    run.earned.wins++
  }
  if (run.stop === run.path.length - 1) completeRoute(s, r)
}

/** El Pokémon de la ruta gana EXP y se apunta en lo ganado en ella */
function gainRunExp(s: GameState, exp: number) {
  const run = s.run!
  run.earned.exp += exp
  run.earned.levelsGained += gainExp(activeMon(s)!, exp).levelsGained
}

/** Derrota: la ruta termina y se pierde parte de lo ganado en ella. Devuelve lo perdido. */
export function faint(s: GameState): number {
  const run = s.run!
  const lost = Math.min(s.money, Math.floor(run.earned.money * DEFEAT_MONEY_LOSS))
  s.money -= lost
  run.earned.money -= lost
  run.phase = 'fainted'
  return lost
}

/** Completa la ruta. Su premio final solo se gana la primera vez; al repetirla quedan los combates */
export function completeRoute(s: GameState, r: Route) {
  const run = s.run!
  run.phase = 'complete'
  if (s.completedRoutes.includes(r.id)) return
  s.completedRoutes.push(r.id)
  s.tickets += r.reward.tickets
  s.money += r.reward.money
  run.earned.tickets += r.reward.tickets
  run.earned.money += r.reward.money
  gainRunExp(s, r.reward.exp)
  if (r.unlocks && !s.unlockedRoutes.includes(r.unlocks)) s.unlockedRoutes.push(r.unlocks)
}
