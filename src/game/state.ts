import type { BattleRecord } from './battle'
import type { UpgradeId } from './upgrades'

export interface OwnedMon {
  uid: string
  speciesId: number
  level: number
  /** EXP acumulada dentro del nivel actual */
  exp: number
  hp: number
  /** Estrellas conseguidas combinando piezas en la Pokédex */
  stars: number
  /** Movimiento que usa en combate (se elige en el rancho) */
  moveId: string
  caughtAt: number
}

export type RunPhase = 'walking' | 'complete' | 'fainted'

export interface Run {
  routeId: string
  /** Nodos elegidos antes de salir, del inicio al final */
  path: string[]
  /** Índice en `path` del último nodo alcanzado */
  stop: number
  /** Pasos dados en el tramo actual */
  steps: number
  phase: RunPhase
  /** Último combate, para que la UI lo reproduzca */
  lastBattle: BattleRecord | null
  /** Milisegundos reales que quedan del combate en curso; mientras sea > 0 no se dan pasos */
  battleMsLeft: number
  /** Lo ganado en la ruta; `pieces` son las especies de las piezas soltadas (una entrada por pieza) */
  earned: {
    money: number
    tickets: number
    pieces: number[]
    exp: number
    levelsGained: number
    wins: number
    battles: number
  }
}

/** Un Pokémon del rancho haciendo una ruta por su cuenta durante un tiempo fijo */
export interface Expedition {
  uid: string
  routeId: string
  /** Minutos de juego que dura */
  durationMin: number
  elapsedMin: number
}

export interface GameState {
  version: number
  money: number
  tickets: number
  owned: OwnedMon[]
  activeUid: string | null
  seen: number[]
  caught: number[]
  /** Piezas de gacha por especie (speciesId → cantidad) */
  pieces: Record<number, number>
  /** Trozos de MissingNo: se obtienen triturando piezas y se cambian por piezas de cualquier Pokémon */
  missingnoShards: number
  /** Especies marcadas como favoritas en la Pokédex: sus piezas no se pueden triturar */
  favorites: number[]
  /** Nivel comprado de cada mejora de la tienda */
  upgrades: Partial<Record<UpgradeId, number>>
  unlockedRoutes: string[]
  completedRoutes: string[]
  run: Run | null
  expeditions: Expedition[]
  /** Multiplicador de tiempo para probar la demo (x1 = tiempo real) */
  timeScale: number
  lastTick: number
}

export const SAVE_VERSION = 10

export function initialState(): GameState {
  return {
    version: SAVE_VERSION,
    money: 1000,
    tickets: 10,
    owned: [],
    activeUid: null,
    seen: [],
    caught: [],
    pieces: {},
    missingnoShards: 0,
    favorites: [],
    upgrades: {},
    unlockedRoutes: ['pueblo-paleta'],
    completedRoutes: [],
    run: null,
    expeditions: [],
    timeScale: 1,
    lastTick: Date.now(),
  }
}

export function findMon(s: GameState, uid: string): OwnedMon | undefined {
  return s.owned.find((m) => m.uid === uid)
}

export function activeMon(s: GameState): OwnedMon | null {
  return (s.activeUid && findMon(s, s.activeUid)) || null
}

export type MonPlace = 'ranch' | 'run' | 'expedition'

/** Dónde está un Pokémon: solo los que están en el rancho se pueden curar, entrenar o enviar */
export function monPlace(s: GameState, uid: string): MonPlace {
  if (s.run && uid === s.activeUid) return 'run'
  if (s.expeditions.some((e) => e.uid === uid)) return 'expedition'
  return 'ranch'
}

/** Recupera una partida guardada de esta versión; los campos que falten toman su valor inicial */
export function restoreState(saved: GameState): GameState | null {
  return saved.version === SAVE_VERSION ? { ...initialState(), ...saved } : null
}
