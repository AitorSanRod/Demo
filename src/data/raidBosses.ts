import { POKEMON } from './pokemon'

// Jefes comunitarios opcionales (pestaña Jefes): siempre hay uno activo; al caer sale el siguiente de la lista (y al
// acabarla, el primero). Los jefes comunitarios de las rutas son paradas `NodeKind.Raid` de cada ruta (kantoMaps.ts).
// Este fichero es para editarlo a mano: jefes, tabla de premios y nombres de los entrenadores bot.

export interface RaidBoss {
  speciesId: number
  level: number
  /** Nivel que necesita un Pokémon para entrar en su sala; sin él, puede entrar cualquiera */
  minLevel?: number
}

export const RAID_BOSSES: RaidBoss[] = [
  { speciesId: POKEMON.Snorlax, level: 15, minLevel: 10 },
  // { speciesId: POKEMON.Onix, level: 15 },
]

export const RaidPrizeKind = { Money: 'money', Tickets: 'tickets', BossPieces: 'bossPieces' } as const
export type RaidPrizeKind = (typeof RaidPrizeKind)[keyof typeof RaidPrizeKind]

/** Una línea de la tabla de premios: cada una se tira por separado con su probabilidad */
export interface RaidPrizeRoll {
  kind: RaidPrizeKind
  amount: number
  /** Probabilidad de 0 a 1 */
  chance: number
}

/** Premio de cada jefe derrotado, igual para todos los que cobran; `BossPieces` son tickets del propio jefe */
export const RAID_PRIZE_TABLE: RaidPrizeRoll[] = [
  { kind: RaidPrizeKind.Money, amount: 500, chance: 1 },
  { kind: RaidPrizeKind.Tickets, amount: 2, chance: 1 },
  { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.5 },
  { kind: RaidPrizeKind.Tickets, amount: 3, chance: 0.15 },
  { kind: RaidPrizeKind.BossPieces, amount: 3, chance: 0.05 },
]

/** Nombres de los entrenadores bot que entran y salen de la sala (provisional hasta tener jugadores reales) */
export const BOT_TRAINERS = ['Lucía', 'Marcos', 'Nerea', 'Iker', 'Carla', 'Hugo', 'Alba', 'Dani', 'Irene', 'Pablo', 'Sara', 'Rubén']
