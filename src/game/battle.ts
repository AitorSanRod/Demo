import { move, type Move } from '../data/moves'
import { species } from '../data/species'
import { effectiveness, type PokeType } from '../data/types'
import { pickOne, type Rng } from './random'
import { calcStats, type Stats } from './stats'

export type Side = 'player' | 'enemy'

export interface Fighter {
  side: Side
  speciesId: number
  name: string
  level: number
  types: PokeType[]
  stats: Stats
  hp: number
  maxHp: number
  /** El jugador lleva uno; el salvaje elige al azar entre los suyos cada turno */
  moves: string[]
}

export interface BattleEvent {
  kind: 'info' | 'attack' | 'hit' | 'miss' | 'faint'
  text: string
  /** Quién actúa (attack) o quién recibe (hit/miss/faint) */
  side?: Side
  playerHp: number
  enemyHp: number
}

export type BattleOutcome = 'win' | 'lose' | 'flee'

export interface BattleRecord {
  player: { speciesId: number; name: string; level: number; maxHp: number }
  enemy: { speciesId: number; name: string; level: number; maxHp: number }
  moveId: string
  events: BattleEvent[]
  outcome: BattleOutcome
  rewards: { money: number; tickets: number; moneyLost: number }
}

/** Turnos tras los que el salvaje huye y el combate acaba sin ganador */
const MAX_TURNS = 25
/** Multiplicador de daño si el movimiento es del mismo tipo que el Pokémon */
const STAB = 1.5

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
  }
}

/** Fórmula de daño de los juegos con una sola stat de ataque y otra de defensa */
function damage(atk: Fighter, def: Fighter, mv: Move, rng: Rng): { dealt: number; eff: number } {
  const eff = effectiveness(mv.type, def.types)
  const stab = atk.types.includes(mv.type) ? STAB : 1
  const raw = (((2 * atk.level) / 5 + 2) * mv.power * (atk.stats.atk / def.stats.def)) / 50 + 2
  const roll = 0.85 + rng() * 0.15
  return { dealt: eff === 0 ? 0 : Math.max(1, Math.floor(raw * stab * eff * roll)), eff }
}

export interface BattleResult {
  events: BattleEvent[]
  outcome: BattleOutcome
  playerHp: number
}

/** Combate automático por turnos: actúa primero el más rápido y cada uno ataca con un movimiento. */
export function simulateBattle(player: Fighter, enemy: Fighter, rng: Rng = Math.random): BattleResult {
  const events: BattleEvent[] = []
  const push = (e: Omit<BattleEvent, 'playerHp' | 'enemyHp'>) =>
    events.push({ ...e, playerHp: player.hp, enemyHp: enemy.hp })
  const label = (f: Fighter) => (f.side === 'enemy' ? `${f.name} salvaje` : f.name)

  push({ kind: 'info', text: `¡Un ${enemy.name} salvaje de Nv. ${enemy.level} apareció!` })

  const attack = (atk: Fighter, def: Fighter) => {
    const mv = move(atk.moves.length === 1 ? atk.moves[0] : pickOne(atk.moves, rng))
    push({ kind: 'attack', side: atk.side, text: `${label(atk)} usó ${mv.name}.` })
    if (rng() * 100 >= mv.accuracy) {
      push({ kind: 'miss', side: def.side, text: '¡Pero falló!' })
      return
    }
    const { dealt, eff } = damage(atk, def, mv, rng)
    if (eff === 0) {
      push({ kind: 'miss', side: def.side, text: `No afecta a ${label(def)}…` })
      return
    }
    def.hp = Math.max(0, def.hp - dealt)
    const note = eff > 1 ? '¡Es muy eficaz!' : eff < 1 ? 'No es muy eficaz…' : ''
    push({ kind: 'hit', side: def.side, text: note })
    if (def.hp === 0) push({ kind: 'faint', side: def.side, text: `¡${label(def)} se debilitó!` })
  }

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const playerFirst = player.stats.spe > enemy.stats.spe || (player.stats.spe === enemy.stats.spe && rng() < 0.5)
    for (const [atk, def] of playerFirst ? [[player, enemy], [enemy, player]] : [[enemy, player], [player, enemy]]) {
      attack(atk, def)
      if (def.hp === 0) return { events, outcome: def === enemy ? 'win' : 'lose', playerHp: player.hp }
    }
  }
  push({ kind: 'info', text: `${label(enemy)} huyó.` })
  return { events, outcome: 'flee', playerHp: player.hp }
}
