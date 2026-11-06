// El ranking de dinero, tal y como lo comparten la web y el servidor (worker/ranking.ts): quién entra, cuántos se ven
// y cada cuánto se rehace la foto.

/** Jugadores que se ven en la lista del ranking */
export const RANKING_SIZE = 25
/** Horas que se rehace el ranking: una vez en cada hora en punto */
const RANKING_REFRESH_HOURS = 1
export const RANKING_REFRESH_MS = RANKING_REFRESH_HOURS * 60 * 60 * 1000
/** Días sin subir la partida a la nube tras los que una cuenta sale del ranking (hasta que vuelva a jugar) */
const RANKING_ACTIVE_DAYS = 7
export const RANKING_ACTIVE_MS = RANKING_ACTIVE_DAYS * 24 * 60 * 60 * 1000

/** Por qué una cuenta no puede ver el ranking */
export const RankingCode = { NoNickname: 'no_nickname', Hidden: 'hidden' } as const
export type RankingCode = (typeof RankingCode)[keyof typeof RankingCode]

export interface RankingEntry {
  rank: number
  nickname: string
  money: number
  /** Es la cuenta que lo mira */
  mine: boolean
}

/** Lo que devuelve el servidor: los primeros, tu puesto (null si aún no entras) y cuándo se hizo la foto */
export interface RankingView {
  top: RankingEntry[]
  mine: { rank: number; money: number } | null
  /** Cuentas que hay en el ranking */
  total: number
  /** Hora (ms) de la foto; null si aún no se ha hecho ninguna */
  builtAt: number | null
}

/** Toca rehacer la foto: no hay ninguna o es de otra hora */
export const rankingDue = (builtAt: number | null, now: number): boolean =>
  builtAt === null || Math.floor(builtAt / RANKING_REFRESH_MS) !== Math.floor(now / RANKING_REFRESH_MS)

/** Hora (ms) de la próxima foto */
export const nextRankingAt = (now: number): number => (Math.floor(now / RANKING_REFRESH_MS) + 1) * RANKING_REFRESH_MS

/** El Pokémon de un entrenador que más daño ha hecho a los jefes comunitarios */
export interface TopMon {
  speciesId: number
  damage: number
}

export interface DamageRankingEntry {
  rank: number
  nickname: string
  /** Daño total a los jefes comunitarios desde que empezó el ranking */
  damage: number
  topMon: TopMon
  /** Es la cuenta que lo mira */
  mine: boolean
}

/** El ranking de daño a los jefes comunitarios: como el de dinero, con el Pokémon que más daño ha hecho de cada uno */
export interface DamageRankingView {
  top: DamageRankingEntry[]
  mine: { rank: number; damage: number; topMon: TopMon } | null
  total: number
  builtAt: number | null
}
