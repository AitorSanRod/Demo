import { RouteId } from '../../data/maps'
import type { RanchTypeId } from '../../data/ranchTypes'
import type { BattleRecord } from '../battle/battle'
import type { Raid, RaidPrize } from '../raid/raidRoom'
import type { UpgradeId } from '../team/upgrades'

export interface OwnedMon {
  uid: string
  speciesId: number
  level: number
  /** EXP acumulada dentro del nivel actual */
  exp: number
  hp: number
  /** Estrellas conseguidas combinando piezas en la Pokédex */
  stars: number
  /** Índice del rancho al que pertenece (aunque esté fuera, su hueco sigue ocupado); null si está en la Caja */
  ranch: number | null
  /** Posición en la hierba elegida arrastrándolo, en % del prado; null para la que sale de su uid */
  spot: RanchSpot | null
}

export interface RanchSpot {
  x: number
  y: number
}

/** `raid`: luchando contra el jefe comunitario de la parada (ver raid/routeRaid.ts) */
type RunPhase = 'walking' | 'raid' | 'complete' | 'fainted'

/** Paso del tutorial inicial (ver tutorial.ts); null cuando ya se juega con libertad */
export const TutorialStep = { Starter: 'starter', Combine: 'combine', Route: 'route' } as const
export type TutorialStep = (typeof TutorialStep)[keyof typeof TutorialStep]

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
  /** Sala del jefe comunitario de la parada en la que está luchando (fase `raid`) */
  raid: Raid | null
  /**
   * Lo ganado en la ruta; `pieces` son las especies de las piezas soltadas (una entrada por pieza) y `raidBosses`, los
   * jefes comunitarios derrotados en ella (su premio ya va sumado en lo demás)
   */
  earned: {
    money: number
    tickets: number
    pieces: number[]
    exp: number
    levelsGained: number
    wins: number
    battles: number
    raidBosses: number[]
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
  /** Especies vistas en una ruta o descubiertas en una expedición (más el inicial y las capturadas) */
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
  /** Objetos de tipo de rancho comprados (cuentan también los colocados) */
  ranchTypeItems: Partial<Record<RanchTypeId, number>>
  /** Tipo de rancho colocado en cada rancho, por su índice; sin entrada, rancho normal */
  ranchTypeOf: Partial<Record<number, RanchTypeId>>
  tutorial: TutorialStep | null
  unlockedRoutes: string[]
  completedRoutes: string[]
  run: Run | null
  expeditions: Expedition[]
  /** Jefe comunitario activo y la sala del jugador; null hasta acabar el tutorial */
  raid: Raid | null
  /** Premios de los jefes de la pestaña Raids derrotados, pendientes de recoger allí */
  raidPrizes: RaidPrize[]
  /** Multiplicador de tiempo (x1 = tiempo real); solo se puede cambiar en desarrollo, desde la barra superior */
  timeScale: number
  lastTick: number
}

export const SAVE_VERSION = 23

export function initialState(): GameState {
  return {
    version: SAVE_VERSION,
    money: 240,
    tickets: 1,
    owned: [],
    activeUid: null,
    seen: [],
    caught: [],
    pieces: {},
    missingnoShards: 0,
    favorites: [],
    upgrades: {},
    ranchTypeItems: {},
    ranchTypeOf: {},
    tutorial: TutorialStep.Starter,
    unlockedRoutes: [RouteId.PuebloPaleta],
    completedRoutes: [],
    run: null,
    expeditions: [],
    raid: null,
    raidPrizes: [],
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

export const MonPlace = { Ranch: 'ranch', Run: 'run', Expedition: 'expedition', Raid: 'raid', Box: 'box' } as const
export type MonPlace = (typeof MonPlace)[keyof typeof MonPlace]

/** Dónde está un Pokémon: solo los que están en el rancho se pueden curar, entrenar o enviar */
export function monPlace(s: GameState, uid: string): MonPlace {
  if (s.run && uid === s.activeUid) return MonPlace.Run
  if (s.expeditions.some((e) => e.uid === uid)) return MonPlace.Expedition
  if (s.raid?.members.some((m) => m.id === uid && !m.left)) return MonPlace.Raid
  if (findMon(s, uid)?.ranch === null) return MonPlace.Box
  return MonPlace.Ranch
}

/** Recupera una partida guardada de esta versión; los campos que falten toman su valor inicial */
export function restoreState(saved: GameState): GameState | null {
  return saved.version === SAVE_VERSION ? { ...initialState(), ...saved } : null
}
