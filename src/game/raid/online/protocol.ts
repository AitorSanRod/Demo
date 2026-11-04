import type { RouteId } from '../../../data/maps'
import type { PassiveRef } from '../../../data/passives'
import type { Raid } from '../raidRoom'

// Lo que se dicen el juego y el servidor de salas compartidas (netlify/functions/raid.mts). Sin cuentas: cada
// dispositivo se identifica con un id anónimo al azar y un apodo.

/** Dónde vive la sala en la partida: el jefe de la pestaña Raids o el de la parada de la ruta en curso */
export const RoomSlot = { Tab: 'tab', Route: 'route' } as const
export type RoomSlot = (typeof RoomSlot)[keyof typeof RoomSlot]

/** Contra qué jefe es la sala: el de la pestaña Raids (por su posición en RAID_BOSSES) o el de una parada de ruta */
export type RoomChannel =
  | { slot: typeof RoomSlot.Tab; bossIndex: number }
  | { slot: typeof RoomSlot.Route; routeId: RouteId; nodeId: string }

export const RaidAction = { Join: 'join', Sync: 'sync' } as const
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

/** Entrar en una sala del jefe: la del jugador si ya estuvo, una con jugadores si cabe (echando a un bot) o una nueva */
export interface JoinRequest extends PlayerRequest {
  action: typeof RaidAction.Join
  channel: RoomChannel
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

export type RaidRequest = JoinRequest | SyncRequest

/**
 * La sala vista por un jugador: sus Pokémon con su uid y `RaidMemberKind.Player`, los de los demás como `Guest`.
 * `exp` son las rondas de EXP que lleva cada uno de sus Pokémon en la sala (por uid)
 */
export interface RoomView {
  roomId: string
  raid: Raid
  exp: Record<string, number>
}

/** Respuesta del servidor: la sala, o null si ya no existe */
export interface RaidResponse {
  view: RoomView | null
}

/** Letras como mucho de un apodo */
export const NICKNAME_MAX = 14
/** Apodo de quien aún no ha elegido uno */
export const DEFAULT_NICKNAME = 'Entrenador'

/** Carpeta del almacén con las salas de un mismo jefe */
export const channelKey = (c: RoomChannel): string => (c.slot === RoomSlot.Tab ? `tab/${c.bossIndex}` : `route/${c.routeId}/${c.nodeId}`)
