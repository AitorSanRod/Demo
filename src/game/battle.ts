import { move, type Move, type StatKey } from '../data/moves'
import { species } from '../data/species'
import { effectiveness, type PokeType } from '../data/types'
import { calcStats, type Stats } from './stats'

export type Side = 'player' | 'enemy'
export type Rng = () => number

export interface Fighter {
  side: Side
  speciesId: number
  name: string
  level: number
  types: PokeType[]
  stats: Stats
  hp: number
  maxHp: number
  moves: string[]
  stages: Record<StatKey, number>
}

export interface BattleEvent {
  kind: 'info' | 'attack' | 'hit' | 'miss' | 'stat' | 'faint'
  text: string
  /** Quién actúa (attack) o quién recibe (hit/stat/faint) */
  side?: Side
  playerHp: number
  enemyHp: number
}

export type BattleOutcome = 'win' | 'lose' | 'flee'

export interface BattleRecord {
  player: { speciesId: number; name: string; level: number; maxHp: number; startHp: number }
  enemy: { speciesId: number; name: string; level: number; maxHp: number; moves: string[] }
  moveId: string
  events: BattleEvent[]
  outcome: BattleOutcome
  rewards: { exp: number; money: number; tickets: number; levelsGained: number; learned: string[]; moneyLost: number }
}

const MAX_TURNS = 25
const STAT_NAMES: Record<StatKey, string> = {
  atk: 'ataque',
  def: 'defensa',
  spa: 'ataque especial',
  spd: 'defensa especial',
  spe: 'velocidad',
}
const PRIORITY: Record<string, number> = { 'quick-attack': 1 }

export function makeFighter(
  side: Side,
  speciesId: number,
  level: number,
  opts: { hp?: number; stars?: number; moves: string[]; statMult?: number },
): Fighter {
  const sp = species(speciesId)
  const stats = calcStats(speciesId, level, opts.stars ?? 0)
  for (const k of Object.keys(stats) as (keyof Stats)[]) {
    stats[k] = Math.max(1, Math.round(stats[k] * (opts.statMult ?? 1)))
  }
  return {
    side,
    speciesId,
    name: sp.name,
    level,
    types: sp.types,
    stats,
    hp: opts.hp ?? stats.hp,
    maxHp: stats.hp,
    moves: opts.moves,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  }
}

const stageMult = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))
const effStat = (f: Fighter, k: StatKey) => f.stats[k] * stageMult(f.stages[k])

function baseDamage(atk: Fighter, def: Fighter, mv: Move): { damage: number; eff: number } {
  const physical = mv.category === 'physical'
  const a = effStat(atk, physical ? 'atk' : 'spa')
  const d = effStat(def, physical ? 'def' : 'spd')
  const eff = effectiveness(mv.type, def.types)
  const stab = atk.types.includes(mv.type) ? 1.5 : 1
  const raw = (((2 * atk.level) / 5 + 2) * mv.power * (a / d)) / 50 + 2
  return { damage: raw * stab * eff, eff }
}

/** IA enemiga: puntúa cada movimiento y elige con algo de azar */
export function chooseEnemyMove(self: Fighter, foe: Fighter, rng: Rng): string {
  if (self.moves.length === 1 || rng() < 0.05) {
    return self.moves[Math.floor(rng() * self.moves.length)]
  }
  const scores = self.moves.map((id) => {
    const mv = move(id)
    if (mv.category === 'status' && mv.effect) {
      const target = mv.effect.target === 'self' ? self : foe
      const stage = target.stages[mv.effect.stat]
      const useful = mv.effect.stages > 0 ? stage < 2 : stage > -2
      return useful && self.hp / self.maxHp > 0.5 ? 6 : 0.5
    }
    let dmg = baseDamage(self, foe, mv).damage * (mv.accuracy / 100)
    if (dmg >= foe.hp) dmg *= 1.5
    return dmg
  })
  const weights = scores.map((s) => s ** 3)
  let roll = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return self.moves[i]
  }
  return self.moves[self.moves.length - 1]
}

export interface BattleResult {
  events: BattleEvent[]
  outcome: BattleOutcome
  playerHp: number
}

/**
 * Combate automático. El jugador usa siempre `playerMoveId`; si es de estado solo
 * lo usa el primer turno y después ataca con `fallbackMoveId`.
 */
export function simulateBattle(
  player: Fighter,
  enemy: Fighter,
  playerMoveId: string,
  fallbackMoveId: string,
  rng: Rng = Math.random,
): BattleResult {
  const events: BattleEvent[] = []
  const push = (e: Omit<BattleEvent, 'playerHp' | 'enemyHp'>) =>
    events.push({ ...e, playerHp: player.hp, enemyHp: enemy.hp })
  const label = (f: Fighter) => (f.side === 'enemy' ? `${f.name} salvaje` : f.name)

  push({ kind: 'info', text: `¡Un ${enemy.name} salvaje de Nv. ${enemy.level} apareció!` })

  const performMove = (atk: Fighter, def: Fighter, mv: Move) => {
    push({ kind: 'attack', side: atk.side, text: `${label(atk)} usó ${mv.name}.` })
    if (rng() * 100 >= mv.accuracy) {
      push({ kind: 'miss', side: def.side, text: '¡Pero falló!' })
      return
    }
    if (mv.category === 'status' && mv.effect) {
      const target = mv.effect.target === 'self' ? atk : def
      const { stat, stages } = mv.effect
      const before = target.stages[stat]
      target.stages[stat] = Math.max(-6, Math.min(6, before + stages))
      const changed = target.stages[stat] !== before
      const verb = stages > 0 ? 'subió' : 'bajó'
      push({
        kind: 'stat',
        side: target.side,
        text: changed
          ? `¡El ${STAT_NAMES[stat]} de ${label(target)} ${verb}!`
          : `El ${STAT_NAMES[stat]} de ${label(target)} no puede cambiar más.`,
      })
      return
    }
    const { damage, eff } = baseDamage(atk, def, mv)
    if (eff === 0) {
      push({ kind: 'miss', side: def.side, text: `No afecta a ${label(def)}…` })
      return
    }
    const crit = rng() < 1 / 16
    const dealt = Math.max(1, Math.floor(damage * (crit ? 1.5 : 1) * (0.85 + rng() * 0.15)))
    def.hp = Math.max(0, def.hp - dealt)
    const notes = [crit && '¡Golpe crítico!', eff > 1 && '¡Es muy eficaz!', eff < 1 && 'No es muy eficaz…']
    push({ kind: 'hit', side: def.side, text: notes.filter(Boolean).join(' ') })
    if (def.hp === 0) push({ kind: 'faint', side: def.side, text: `¡${label(def)} se debilitó!` })
  }

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const pId = turn > 1 && move(playerMoveId).category === 'status' ? fallbackMoveId : playerMoveId
    const actions: [Fighter, Fighter, Move][] = [
      [player, enemy, move(pId)],
      [enemy, player, move(chooseEnemyMove(enemy, player, rng))],
    ]
    actions.sort(([a, , am], [b, , bm]) => {
      const prio = (PRIORITY[bm.id] ?? 0) - (PRIORITY[am.id] ?? 0)
      if (prio !== 0) return prio
      return effStat(b, 'spe') - effStat(a, 'spe') || (rng() < 0.5 ? -1 : 1)
    })
    for (const [atk, def, mv] of actions) {
      if (atk.hp === 0) continue
      performMove(atk, def, mv)
      if (def.hp === 0) {
        return { events, outcome: def === enemy ? 'win' : 'lose', playerHp: player.hp }
      }
    }
  }
  push({ kind: 'info', text: `${label(enemy)} huyó.` })
  return { events, outcome: 'flee', playerHp: player.hp }
}
