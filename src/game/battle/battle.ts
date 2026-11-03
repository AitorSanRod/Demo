import { signatureMove, type Move } from '../../data/moves'
import type { PassiveRef, StatusId } from '../../data/passives'
import { species } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { Rng } from '../core/random'
import { calcStats, type Stats } from '../team/stats'
import { attack } from './attack'
import { combineBonus, type CombatBonus } from './combatBonus'
import { endOfTurn } from './status'

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
  /** Su único ataque (ver signatureMove) */
  move: Move
  /** Sus pasivas sumadas (las stats ya van aplicadas en `stats`) */
  bonus: CombatBonus
  status: StatusId | null
  /** Turnos que le quedan sin poder moverse por la congelación */
  frozenTurns: number
}

export interface BattleEvent {
  /** status: recibe un estado o no puede moverse por él; heal: recupera PS */
  kind: 'info' | 'attack' | 'hit' | 'miss' | 'faint' | 'status' | 'heal'
  text: string
  /** Quién actúa (attack) o a quién le pasa (el resto) */
  side?: Side
  /** Estado alterado del evento (al recibirlo, al sufrirlo o al hacer daño por él) */
  status?: StatusId
  playerHp: number
  enemyHp: number
}

type BattleOutcome = 'win' | 'lose' | 'flee'

export interface BattleRecord {
  player: { speciesId: number; name: string; level: number; maxHp: number }
  enemy: { speciesId: number; name: string; level: number; maxHp: number }
  events: BattleEvent[]
  outcome: BattleOutcome
  /** Combate contra el jefe de la parada (se ve distinto y da más premio) */
  boss: boolean
  /** `piece`: si el salvaje soltó 1 pieza de su especie */
  rewards: { money: number; tickets: number; exp: number; piece: boolean; moneyLost: number }
}

/** Turnos tras los que el salvaje huye y el combate acaba sin ganador */
const MAX_TURNS = 25

export function makeFighter(
  side: Side,
  speciesId: number,
  level: number,
  opts: { hp?: number; stars?: number; statMult?: number; passives?: PassiveRef[] } = {},
): Fighter {
  const sp = species(speciesId)
  const bonus = combineBonus(opts.passives ?? [])
  const stats = calcStats(speciesId, level, opts.stars ?? 0)
  for (const k of Object.keys(stats) as (keyof Stats)[]) {
    stats[k] = Math.max(1, Math.round(stats[k] * (opts.statMult ?? 1) * (1 + bonus[k])))
  }
  return {
    side,
    speciesId,
    name: sp.name,
    level,
    types: sp.types,
    stats,
    // Los PS actuales crecen en la misma proporción que los máximos (la pasiva de PS no es una cura)
    hp: Math.min(stats.hp, Math.round((opts.hp ?? Infinity) * (1 + bonus.hp))),
    maxHp: stats.hp,
    move: signatureMove(speciesId),
    bonus,
    status: null,
    frozenTurns: 0,
  }
}

interface BattleResult {
  events: BattleEvent[]
  outcome: BattleOutcome
  playerHp: number
}

/** Registro de eventos del combate; cada uno guarda los PS de ambos en ese momento */
export type Push = (e: Omit<BattleEvent, 'playerHp' | 'enemyHp'>) => void

export const label = (f: Fighter) => (f.side === 'enemy' ? `${f.name} salvaje` : f.name)

/** Combate automático por turnos: actúa primero el más rápido; al final de cada turno pesan los estados y la regeneración */
export function simulateBattle(player: Fighter, enemy: Fighter, rng: Rng = Math.random): BattleResult {
  const events: BattleEvent[] = []
  const push: Push = (e) => events.push({ ...e, playerHp: player.hp, enemyHp: enemy.hp })
  const outcome = (): BattleOutcome | null => (enemy.hp === 0 ? 'win' : player.hp === 0 ? 'lose' : null)

  push({ kind: 'info', text: `¡Un ${enemy.name} salvaje de Nv. ${enemy.level} apareció!` })

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const playerFirst = player.stats.spe > enemy.stats.spe || (player.stats.spe === enemy.stats.spe && rng() < 0.5)
    for (const [atk, def] of playerFirst ? [[player, enemy], [enemy, player]] : [[enemy, player], [player, enemy]]) {
      attack(atk, def, push, rng)
      const ended = outcome()
      if (ended) return { events, outcome: ended, playerHp: player.hp }
    }
    endOfTurn([player, enemy], push)
    const ended = outcome()
    if (ended) return { events, outcome: ended, playerHp: player.hp }
  }
  push({ kind: 'info', text: `${label(enemy)} huyó.` })
  return { events, outcome: 'flee', playerHp: player.hp }
}
