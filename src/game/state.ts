import type { BattleRecord } from './battle'

export interface OwnedMon {
  uid: string
  speciesId: number
  level: number
  /** EXP acumulada dentro del nivel actual */
  exp: number
  hp: number
  /** Mejoras por duplicados del gacha */
  stars: number
  /** Movimientos equipados (máx. 4) */
  moves: string[]
  caughtAt: number
}

export type RunPhase = 'choose' | 'walking' | 'battle' | 'complete'

export interface Run {
  routeId: string
  /** Último nodo alcanzado */
  nodeId: string
  /** Nodo hacia el que se camina (fase 'walking') */
  targetId: string | null
  steps: number
  stepsNeeded: number
  /** Movimiento elegido para el tramo actual */
  moveId: string
  phase: RunPhase
  battle: BattleRecord | null
  visited: string[]
  earned: { money: number; tickets: number; exp: number; wins: number }
  startedAt: number
}

export interface GameState {
  version: number
  money: number
  tickets: number
  owned: OwnedMon[]
  activeUid: string | null
  seen: number[]
  caught: number[]
  unlockedRoutes: string[]
  completedRoutes: string[]
  run: Run | null
  /** Multiplicador de tiempo para probar la demo (x1 = tiempo real) */
  timeScale: number
  lastTick: number
}

export const SAVE_VERSION = 1

export function initialState(): GameState {
  return {
    version: SAVE_VERSION,
    money: 200,
    tickets: 3,
    owned: [],
    activeUid: null,
    seen: [],
    caught: [],
    unlockedRoutes: ['ruta-1'],
    completedRoutes: [],
    run: null,
    timeScale: 1,
    lastTick: Date.now(),
  }
}

export function activeMon(s: GameState): OwnedMon | null {
  return s.owned.find((m) => m.uid === s.activeUid) ?? null
}
