import { POKEMON } from './pokemon'

// Jefes comunitarios opcionales (pestaña Raids): siempre hay uno activo; al caer sale el siguiente de la lista (y al
// acabarla, el primero). Los jefes comunitarios de las rutas son paradas `NodeKind.Raid` de cada ruta (kantoMaps.ts).
// Este fichero es para editarlo a mano: jefes, tablas de premios y nombres de los entrenadores bot.

/** Categoría de premios de un jefe comunitario: elige su tabla en RAID_PRIZE_TABLES */
export const RaidTier = { Low: 'low', Mid: 'mid', High: 'high' } as const
export type RaidTier = (typeof RaidTier)[keyof typeof RaidTier]

export interface RaidBoss {
  speciesId: number
  level: number
  /** Nivel que necesita un Pokémon para entrar en su sala; sin él, puede entrar cualquiera */
  minLevel?: number
  /** Minutos que tardaría en caer con un solo Pokémon de su nivel, si es jefe comunitario; sin él, RAID_SOLO_MINUTES */
  soloMinutes?: number
  /** Tabla de premios que da al caer */
  tier: RaidTier
}

export const RAID_BOSSES: RaidBoss[] = [
  { speciesId: POKEMON.Snorlax, level: 15, minLevel: 10, tier: RaidTier.Low },
  { speciesId: POKEMON.Rapidash, level: 30, minLevel: 25, tier: RaidTier.High },
  // { speciesId: POKEMON.Onix, level: 15, tier: RaidTier.Mid },
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

/**
 * Premio de un jefe derrotado según su categoría, igual para todos los que cobran; `BossPieces` son tickets del propio
 * jefe. Cada línea se tira por separado
 */
export const RAID_PRIZE_TABLES: Record<RaidTier, RaidPrizeRoll[]> = {
  [RaidTier.Low]: [
    { kind: RaidPrizeKind.Money, amount: 80, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 300, chance: 0.3 },
    { kind: RaidPrizeKind.Money, amount: 100, chance: 0.4 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
  ],
  [RaidTier.Mid]: [
    { kind: RaidPrizeKind.Money, amount: 500, chance: 0.1 },
    { kind: RaidPrizeKind.Money, amount: 250, chance: 0.15 },
    { kind: RaidPrizeKind.Money, amount: 200, chance: 0.2 },
    { kind: RaidPrizeKind.Money, amount: 100, chance: 0.25 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.15 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.25 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
  ],
  [RaidTier.High]: [
    { kind: RaidPrizeKind.Money, amount: 1000, chance: 0.5 },
    { kind: RaidPrizeKind.Tickets, amount: 2, chance: 1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.5 },
    { kind: RaidPrizeKind.BossPieces, amount: 2, chance: 0.1 },
  ],
}

/** Nombres de los entrenadores bot que entran y salen de la sala (provisional hasta tener jugadores reales) */
export const BOT_TRAINERS = ['Lucía', 'Marcos', 'Nerea', 'Iker', 'Carla', 'Hugo', 'Alba', 'Dani', 'Irene', 'Pablo', 'Sara', 'Rubén']
