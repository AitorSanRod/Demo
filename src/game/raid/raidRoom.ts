import type { RouteId } from '../../data/maps'
import type { RaidBoss } from '../../data/raidBosses'

/** Participantes que caben a la vez en una sala (jugadores y bots) */
export const RAID_ROOM_SIZE = 10

/** Id del jefe en los golpes de una ronda */
export const BOSS_ID = 'boss'

/** Quién está detrás de un participante; los bots desaparecerán cuando haya jugadores reales */
export const RaidMemberKind = { Player: 'player', Bot: 'bot' } as const
export type RaidMemberKind = (typeof RaidMemberKind)[keyof typeof RaidMemberKind]

/** Un Pokémon de la sala. Los del jugador se identifican por su uid; los bots, por un id propio */
export interface RaidMember {
  id: string
  kind: RaidMemberKind
  trainer: string
  speciesId: number
  level: number
  stars: number
  /** PS actuales como fracción de sus PS máximos (0 = debilitado) */
  hpFraction: number
  /** Milisegundos de juego que le quedan para revivir; 0 si está luchando */
  downMs: number
  /** Milisegundos de juego que ha estado dentro durante el jefe actual */
  presentMs: number
  /** Daño total hecho al jefe actual */
  damage: number
  /** Ya no está en la sala, pero se recuerda para el reparto del jefe actual */
  left: boolean
  /** Bots: milisegundos de juego que le quedan antes de irse; null para los jugadores */
  stayMs: number | null
}

/** Un golpe de la última ronda, para que la UI lo pinte; `from`/`to` son ids de participante o BOSS_ID */
export interface RaidHit {
  from: string
  to: string
  dealt: number
  /** Eficacia del ataque (0, 0.5, 1, 2…) */
  eff: number
  fainted: boolean
}

/** Parada de ruta (`NodeKind.Raid`) en la que está una sala */
export interface RaidPlace {
  routeId: RouteId
  nodeId: string
}

/** Un jefe comunitario y una sala luchando contra él */
export interface Raid {
  boss: RaidBoss
  /** Parada de ruta de la sala; null para el jefe de la pestaña Jefes */
  place: RaidPlace | null
  hp: number
  maxHp: number
  /** Milisegundos de juego desde que apareció este jefe */
  elapsedMs: number
  /** Milisegundos de juego que faltan para la próxima ronda */
  roundMsLeft: number
  round: number
  members: RaidMember[]
  lastRound: RaidHit[]
  /** Jefes de la pestaña Jefes derrotados desde el principio: decide cuál sale ahora (0 en las salas de ruta) */
  felled: number
  /** Contador para dar ids únicos a los bots */
  nextBotId: number
}

/** Premio de un jefe comunitario derrotado */
export interface RaidPrize {
  bossSpeciesId: number
  money: number
  tickets: number
  /** Tickets (piezas) de la especie del jefe */
  pieces: number
}

type MemberIdentity = Pick<RaidMember, 'id' | 'kind' | 'trainer' | 'speciesId' | 'level' | 'stars'>

/** Participante recién llegado: en pie, sin daño ni tiempo dentro */
export function newMember(who: MemberIdentity, hpFraction = 1, stayMs: number | null = null): RaidMember {
  return { ...who, hpFraction, downMs: 0, presentMs: 0, damage: 0, left: false, stayMs }
}

/** Los que siguen en la sala (luchando o esperando a revivir) */
export const presentMembers = (raid: Raid): RaidMember[] => raid.members.filter((m) => !m.left)

export const hasRoom = (raid: Raid): boolean => presentMembers(raid).length < RAID_ROOM_SIZE
