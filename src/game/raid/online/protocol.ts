import type { RouteId } from '../../../data/maps'
import type { PassiveRef } from '../../../data/passives'
import type { Raid, RaidPlace } from '../raidRoom'

// Lo que se dicen el juego y el servidor de salas compartidas (worker/raid.ts). Sin cuentas: cada
// dispositivo se identifica con un id anónimo al azar y un apodo.

/** Dónde vive la sala en la partida: el jefe de la pestaña Raids o el de la parada de la ruta en curso */
export const RoomSlot = { Tab: 'tab', Route: 'route' } as const
export type RoomSlot = (typeof RoomSlot)[keyof typeof RoomSlot]

/**
 * Rotaciones de jefes de la pestaña Raids, a la vez y cada una con su ciclo (ver raidCycle.ts): una sigue el orden de
 * RAID_BOSSES y la otra elige al azar, para que el jugador pueda escoger entre dos jefes
 */
export const RaidRotation = { Ordered: 'ordered', Random: 'random' } as const
export type RaidRotation = (typeof RaidRotation)[keyof typeof RaidRotation]
/** Las rotaciones en el orden en que se enseñan */
export const RAID_ROTATIONS: RaidRotation[] = [RaidRotation.Ordered, RaidRotation.Random]

export type RouteChannel = { slot: typeof RoomSlot.Route; routeId: RouteId; nodeId: string }

/**
 * Contra qué jefe es la sala: el del ciclo `cycle` de una rotación de la pestaña Raids (lo decide el servidor, ver
 * raidCycle.ts) o el de una parada de ruta
 */
export type TabChannel = { slot: typeof RoomSlot.Tab; rotation: RaidRotation; cycle: number }
export type RoomChannel = TabChannel | RouteChannel

/** El jefe que pide el jugador al entrar: el de la pestaña Raids que haya ahora o el de una parada de ruta */
export type JoinChannel = { slot: typeof RoomSlot.Tab } | RouteChannel

export const RaidAction = { Join: 'join', Sync: 'sync', Feed: 'feed' } as const
export type RaidAction = (typeof RaidAction)[keyof typeof RaidAction]

/** Lo que el servidor necesita del Pokémon para que luche como en la partida */
export interface MonSnapshot {
  uid: string
  speciesId: number
  level: number
  stars: number
  /** PS con los que entra, como fracción de los máximos */
  hpFraction: number
  /** Pasivas de su rancho */
  passives: PassiveRef[]
}

interface PlayerRequest {
  playerId: string
  nickname: string
}

/**
 * Entrar en una sala del jefe: `targetRoomId` si se eligió una (pestaña Raids) y cabe; si no, la del jugador si ya
 * estuvo, una con jugadores si cabe (echando a un bot), la principal o una nueva
 */
export interface JoinRequest extends PlayerRequest {
  action: typeof RaidAction.Join
  channel: JoinChannel
  targetRoomId: string | null
  mon: MonSnapshot
  /** Paradas de ruta: vida del jefe (fracción) si hay que abrir una sala en marcha; null, sala nueva */
  bossHp: number | null
}

/** Ponerse al día con la sala; `mon` es el Pokémon que el jugador quiere tener dentro (null: ninguno, se retira) */
export interface SyncRequest extends PlayerRequest {
  action: typeof RaidAction.Sync
  roomId: string
  mon: MonSnapshot | null
}

/** Lo que hay ahora en la pestaña Raids; `watchRoomId`, la sala que el jugador ha elegido mirar (null: la del frontal) */
export interface FeedRequest extends PlayerRequest {
  action: typeof RaidAction.Feed
  watchRoomId: string | null
}

export type RaidRequest = JoinRequest | SyncRequest | FeedRequest

/**
 * La sala vista por un jugador: sus Pokémon con su uid y `RaidMemberKind.Player`, los de los demás como `Guest`.
 * `exp` son las rondas de EXP que lleva cada uno de sus Pokémon en la sala (por uid). `closed`: el jefe se escapó
 * (el ciclo pasó al siguiente antes de que cayera)
 */
export interface RoomView {
  roomId: string
  raid: Raid
  exp: Record<string, number>
  closed: boolean
}

/** Una sala en la lista de salas */
export interface RoomSummary {
  roomId: string
  bossSpeciesId: number
  bossLevel: number
  hpFraction: number
  /** Jugadores con un Pokémon dentro (sin contar bots) */
  players: number
  bots: number
  /** Parada de ruta de la sala; null para las de la pestaña Raids */
  place: RaidPlace | null
  /** Se puede entrar ahora */
  open: boolean
}

/** Fase del ciclo del jefe de la pestaña Raids (ver raidCycle.ts) */
export const CyclePhase = { Active: 'active', Closing: 'closing' } as const
export type CyclePhase = (typeof CyclePhase)[keyof typeof CyclePhase]

/** Una rotación de la pestaña Raids según el servidor */
export interface RotationFeed {
  rotation: RaidRotation
  /** Posición en RAID_BOSSES del jefe del ciclo actual */
  bossIndex: number
  /** Posición en RAID_BOSSES del jefe que vendrá después */
  nextBossIndex: number
  phase: CyclePhase
  /** Cerrándose: hora real a partir de la cual puede aparecer el siguiente jefe (si ya no quedan salas pendientes) */
  nextAt: number | null
  /** La sala que se ve en el frontal; null si no queda ninguna en pie (se espera al siguiente jefe) */
  featured: RoomView | null
  /** Salas del jefe actual de la rotación */
  rooms: RoomSummary[]
}

/** La pestaña Raids según el servidor */
export interface RaidFeed {
  /** Hora real del servidor: con ella cada móvil cuenta igual las esperas */
  serverNow: number
  /** Una por rotación, en el orden de RAID_ROTATIONS */
  rotations: RotationFeed[]
  /** Salas de las paradas de ruta con jugadores dentro (solo para mirar) */
  routeRooms: RoomSummary[]
}

/** Respuesta del servidor: la sala (null si ya no existe o no hay jefe al que entrar) o la pestaña Raids */
export interface RaidResponse {
  view?: RoomView | null
  feed?: RaidFeed
}

/** Letras como mucho de un apodo */
export const NICKNAME_MAX = 14
/** Apodo de quien aún no ha elegido uno */
export const DEFAULT_NICKNAME = 'Entrenador'

/** Prefijo de las salas de las paradas de ruta en el almacén */
export const ROUTE_CHANNEL_PREFIX = 'route/'

/** Carpeta del almacén con las salas de un mismo jefe */
export const channelKey = (c: RoomChannel): string =>
  c.slot === RoomSlot.Tab ? `tab/${c.rotation}/${c.cycle}` : `${ROUTE_CHANNEL_PREFIX}${c.routeId}/${c.nodeId}`

/**
 * Rotación de una sala de la pestaña Raids por su id (empieza por la carpeta de su jefe); sin id, o si es de antes de
 * las rotaciones, la ordenada
 */
export const roomRotation = (roomId: string | null): RaidRotation =>
  roomId?.startsWith(`tab/${RaidRotation.Random}/`) ? RaidRotation.Random : RaidRotation.Ordered
