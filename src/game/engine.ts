import { node, route, type Encounter, type Route, type RouteNode } from '../data/maps'
import { defaultMoves, knownMoves, move } from '../data/moves'
import { species } from '../data/species'
import { makeFighter, simulateBattle, type BattleRecord, type Rng } from './battle'
import { activeMon, type GameState, type OwnedMon } from './state'
import { calcStats, expReward, expToNext, gainExp, maxHp, stepsPerMinute, type LevelUpResult } from './stats'

/** Fracción de PS máximos que se recupera por minuto descansando en el rancho */
export const REGEN_PER_MIN = 0.1
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000
const TICKET_DROP_CHANCE = 0.15
/** Multiplicador de stats de los salvajes (1 = igual que un Pokémon criado en el rancho) */
const WILD_STAT_MULT = 1
/** PS (fracción del máximo) que se recuperan tras ganar un combate */
const POST_WIN_HEAL = 0.1
/** Fracción del dinero ganado en la ruta que se pierde al ser derrotado */
const DEFEAT_MONEY_LOSS = 0.5

const randInt = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1))
const newUid = () => Math.random().toString(36).slice(2, 10)

export function createMon(speciesId: number, level: number): OwnedMon {
  return {
    uid: newUid(),
    speciesId,
    level,
    exp: 0,
    hp: calcStats(speciesId, level).hp,
    stars: 0,
    moves: defaultMoves(speciesId, level),
    caughtAt: Date.now(),
  }
}

export function markSeen(s: GameState, speciesId: number) {
  if (!s.seen.includes(speciesId)) s.seen.push(speciesId)
}

export function markCaught(s: GameState, speciesId: number) {
  markSeen(s, speciesId)
  if (!s.caught.includes(speciesId)) s.caught.push(speciesId)
}

export function chooseStarter(s: GameState, speciesId: number) {
  const mon = createMon(speciesId, 5)
  s.owned.push(mon)
  s.activeUid = mon.uid
  markCaught(s, speciesId)
}

// ---------------------------------------------------------------- Tiempo

export function tick(s: GameState, now: number) {
  const dt = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS)
  s.lastTick = now
  const minutes = (dt / 60000) * s.timeScale
  const mon = activeMon(s)

  if (s.run?.phase === 'walking' && mon) addSteps(s, stepsPerMinute(mon) * minutes)

  // Los Pokémon que están en el rancho descansan y recuperan PS
  for (const m of s.owned) {
    if (s.run && m.uid === s.activeUid) continue
    m.hp = Math.min(maxHp(m), m.hp + maxHp(m) * REGEN_PER_MIN * minutes)
  }
}

// ---------------------------------------------------------------- Runs

export function runBlocker(s: GameState): string | null {
  const mon = activeMon(s)
  if (!mon) return 'No tienes Pokémon activo.'
  if (s.run) return 'Ya hay una ruta en curso.'
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado. Cúralo en el rancho.`
  return null
}

export function startRun(s: GameState, routeId: string) {
  const mon = activeMon(s)
  if (!mon || runBlocker(s)) return
  const r = route(routeId)
  const start = r.nodes.find((n) => n.kind === 'start') ?? r.nodes[0]
  s.run = {
    routeId,
    nodeId: start.id,
    targetId: null,
    steps: 0,
    stepsNeeded: 0,
    moveId: mon.moves[0],
    phase: 'choose',
    battle: null,
    visited: [start.id],
    earned: { money: 0, tickets: 0, exp: 0, wins: 0 },
    startedAt: Date.now(),
  }
}

/** Elegir siguiente nodo y movimiento para el tramo, y echar a andar */
export function depart(s: GameState, targetId: string, moveId: string) {
  const run = s.run
  if (!run || run.phase !== 'choose') return
  const edge = node(route(run.routeId), run.nodeId).next.find((e) => e.to === targetId)
  if (!edge) return
  run.targetId = targetId
  run.stepsNeeded = edge.steps
  run.steps = 0
  run.moveId = moveId
  run.phase = 'walking'
}

export function addSteps(s: GameState, amount: number) {
  const run = s.run
  if (!run || run.phase !== 'walking') return
  run.steps = Math.min(run.stepsNeeded, run.steps + amount)
  if (run.steps >= run.stepsNeeded) arrive(s)
}

function arrive(s: GameState, rng: Rng = Math.random) {
  const run = s.run!
  const r = route(run.routeId)
  const n = node(r, run.targetId!)
  run.nodeId = n.id
  run.targetId = null
  run.visited.push(n.id)
  if (n.kind === 'wild') wildBattle(s, r, n, rng)
}

function pickEncounter(pool: Encounter[], rng: Rng): number {
  let roll = rng() * pool.reduce((a, e) => a + e.weight, 0)
  for (const e of pool) {
    roll -= e.weight
    if (roll <= 0) return e.speciesId
  }
  return pool[pool.length - 1].speciesId
}

function wildBattle(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  const mon = activeMon(s)!
  const enemyId = pickEncounter(n.encounters ?? r.encounters, rng)
  const level = randInt(r.levels[0], r.levels[1], rng) + (n.levelBonus ?? 0)
  const enemy = makeFighter('enemy', enemyId, level, { moves: defaultMoves(enemyId, level), statMult: WILD_STAT_MULT })
  const player = makeFighter('player', mon.speciesId, mon.level, {
    hp: Math.floor(mon.hp),
    stars: mon.stars,
    moves: mon.moves,
  })
  const fallback = mon.moves.find((id) => move(id).category !== 'status') ?? 'tackle'
  const result = simulateBattle(player, enemy, run.moveId, fallback, rng)
  markSeen(s, enemyId)

  const record: BattleRecord = {
    player: { speciesId: mon.speciesId, name: player.name, level: mon.level, maxHp: player.maxHp, startHp: Math.floor(mon.hp) },
    enemy: { speciesId: enemyId, name: enemy.name, level, maxHp: enemy.maxHp, moves: enemy.moves },
    moveId: run.moveId,
    events: result.events,
    outcome: result.outcome,
    rewards: { exp: 0, money: 0, tickets: 0, levelsGained: 0, learned: [], moneyLost: 0 },
  }
  mon.hp = result.playerHp

  if (result.outcome === 'win') {
    const exp = expReward(enemyId, level)
    const money = 8 + level * 4 + randInt(0, 5, rng)
    const tickets = rng() < TICKET_DROP_CHANCE ? 1 : 0
    const lvl = gainExp(mon, exp)
    mon.hp = Math.min(maxHp(mon), mon.hp + Math.ceil(maxHp(mon) * POST_WIN_HEAL))
    s.money += money
    s.tickets += tickets
    run.earned.money += money
    run.earned.tickets += tickets
    run.earned.exp += exp
    run.earned.wins++
    record.rewards = { exp, money, tickets, ...lvl, moneyLost: 0 }
  } else if (result.outcome === 'lose') {
    // Derrota: la ruta termina y se pierde la mitad de lo ganado en ella
    const lost = Math.min(s.money, Math.floor(run.earned.money * DEFEAT_MONEY_LOSS))
    s.money -= lost
    run.earned.money -= lost
    record.rewards.moneyLost = lost
  }
  run.battle = record
  run.phase = 'battle'
}

/** Cerrar el combate visto. Devuelve 'fainted' si el Pokémon cayó y la run terminó. */
export function dismissBattle(s: GameState): 'fainted' | 'complete' | 'continue' | null {
  const run = s.run
  if (!run || run.phase !== 'battle' || !run.battle) return null
  const outcome = run.battle.outcome
  run.battle = null
  if (outcome === 'lose') {
    s.run = null
    return 'fainted'
  }
  const r = route(run.routeId)
  if (node(r, run.nodeId).next.length === 0) {
    completeRoute(s, r)
    return 'complete'
  }
  run.phase = 'choose'
  return 'continue'
}

function completeRoute(s: GameState, r: Route) {
  const run = s.run!
  s.tickets += r.reward.tickets
  s.money += r.reward.money
  run.earned.tickets += r.reward.tickets
  run.earned.money += r.reward.money
  if (!s.completedRoutes.includes(r.id)) s.completedRoutes.push(r.id)
  if (r.unlocks && !s.unlockedRoutes.includes(r.unlocks)) s.unlockedRoutes.push(r.unlocks)
  run.phase = 'complete'
}

/** Volver al rancho: al terminar la ruta o abandonándola (se conserva lo ganado) */
export function endRun(s: GameState) {
  if (s.run?.phase === 'battle') return
  s.run = null
}

// ---------------------------------------------------------------- Rancho

export const healCost = (m: OwnedMon) => 5 + m.level * 3
export const trainCost = (m: OwnedMon) => 20 + m.level * 8

const inRun = (s: GameState, m: OwnedMon) => !!s.run && m.uid === s.activeUid
const findMon = (s: GameState, uid: string) => s.owned.find((m) => m.uid === uid)

export function healInstant(s: GameState, uid: string): boolean {
  const m = findMon(s, uid)
  if (!m || inRun(s, m) || s.money < healCost(m) || m.hp >= maxHp(m)) return false
  s.money -= healCost(m)
  m.hp = maxHp(m)
  return true
}

export function train(s: GameState, uid: string): LevelUpResult | null {
  const m = findMon(s, uid)
  if (!m || inRun(s, m) || s.money < trainCost(m)) return null
  s.money -= trainCost(m)
  return gainExp(m, Math.ceil(expToNext(m.level) * 0.4))
}

export function setActive(s: GameState, uid: string) {
  if (s.run || !findMon(s, uid)) return
  s.activeUid = uid
}

export function setMoves(s: GameState, uid: string, moves: string[]) {
  const m = findMon(s, uid)
  if (!m || inRun(s, m) || moves.length < 1 || moves.length > 4) return
  const known = knownMoves(m.speciesId, m.level)
  if (moves.every((id) => known.includes(id))) m.moves = moves
}
