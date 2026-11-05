import type { RouteId } from '../../data/maps'
import type { RaidBoss } from '../../data/raidBosses'

/** Participantes que caben a la vez en una sala (jugadores y bots) */
export const RAID_ROOM_SIZE = 10

/** Id del jefe en los golpes de una ronda */
export const BOSS_ID = 'boss'

/**
 * Quién está detrás de un participante: `Player`, un Pokémon de este jugador; `Guest`, el de otro jugador real (solo
 * en las salas compartidas del servidor); `Bot`, uno de relleno
 */
export const RaidMemberKind = { Player: 'player', Guest: 'guest', Bot: 'bot' } as const
export type RaidMemberKind = (typeof RaidMemberKind)[keyof typeof RaidMemberKind]

/** Un Pokémon de la sala. Los del jugador se identifican por su uid; los demás, por un id propio de la sala */
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
  /** Veces que aún puede caer (cada vez que cae, una menos); null si no tiene límite */
  lives: number | null
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

/**
 * Enlace de una sala con su copia compartida del servidor (ver raid/online/). `roomId` null: aún entrando (mientras,
 * se juega en local); con id, el servidor manda y la sala local es solo su reflejo
 */
export interface RoomLink {
  roomId: string | null
  /** Rondas de EXP que el servidor ha contado a cada Pokémon del jugador (por uid) y ya se le han dado */
  exp: Record<string, number>
  /** Mientras entra en una parada: vida del jefe (fracción) si el servidor tiene que abrir una sala en marcha; null, nueva */
  openHp: number | null
  /** Mientras entra en la pestaña Raids: la sala elegida (la del frontal o una de la lista); null, la que diga el servidor */
  target: string | null
}

/** Enlace de una sala que espera sitio en una compartida del servidor */
export const pendingLink = (openHp: number | null = null, target: string | null = null): RoomLink => ({ roomId: null, exp: {}, openHp, target })

/** Un jefe comunitario y una sala luchando contra él */
export interface Raid {
  boss: RaidBoss
  /** Parada de ruta de la sala; null para el jefe de la pestaña Raids */
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
  /** Jefes de la pestaña Raids derrotados desde el principio: decide cuál sale ahora (0 en las salas de ruta) */
  felled: number
  /** Contador para dar ids únicos a los bots */
  nextBotId: number
  /** Milisegundos de juego desde que entró el último bot (o desde que apareció el jefe) */
  sinceBotMs: number
  /** Milisegundos de juego que faltan para que aparezca el jefe (pestaña Raids, tras caer el anterior); 0 si ya está */
  startsInMs: number
  /** Sala compartida del servidor de la que es reflejo; null si se juega solo en local */
  remote: RoomLink | null
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
  return { ...who, hpFraction, downMs: 0, presentMs: 0, damage: 0, left: false, stayMs, lives: null }
}

/** Ha gastado todas sus vidas: ya no puede seguir en la pelea */
export const outOfLives = (m: RaidMember): boolean => m.lives === 0

/** Los que siguen en la sala (luchando o esperando a revivir) */
export const presentMembers = (raid: Raid): RaidMember[] => raid.members.filter((m) => !m.left)

export const hasRoom = (raid: Raid): boolean => presentMembers(raid).length < RAID_ROOM_SIZE
