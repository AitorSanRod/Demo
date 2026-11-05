// Copia del equipo (los Pokémon y sus expediciones en curso), aparte de la partida: es la red de seguridad si la
// partida guardada no se puede leer. Normalmente una partida de otra versión se migra entera (saveMigration.ts).
import { route } from '../../data/maps'
import { SPECIES } from '../../data/species'
import { markCaught } from '../collection/dex'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon } from '../team/mons'
import { expToNext, MAX_LEVEL, MAX_STARS } from '../team/stats'
import { UPGRADES } from '../team/upgrades'
import type { GameState } from './state'

/**
 * Versión del formato de la copia. Es independiente de SAVE_VERSION y solo debe subir si cambia la forma de
 * TeamBackup de forma incompatible (subirla descarta las copias guardadas: los campos nuevos van opcionales). El
 * formato 1 (sin ranchos ni Caja) se descarta a propósito: esas partidas empiezan de cero.
 */
const TEAM_BACKUP_FORMAT = 2
/** Ranchos que puede llegar a tener el jugador: el primero más todos los de la tienda */
const MAX_RANCHES = 1 + UPGRADES.ranches.prices.length

interface BackedUpMon {
  speciesId: number
  level: number
  exp: number
  stars: number
  /** Rancho al que pertenece, o null si está en la Caja */
  ranch: number | null
}

/** Una expedición en curso; su Pokémon va por su posición en `mons` (al rehacerlo tendrá otro uid) */
interface BackedUpExpedition {
  monIndex: number
  routeId: string
  durationMin: number
  elapsedMin: number
}

export interface TeamBackup {
  format: typeof TEAM_BACKUP_FORMAT
  /** Posición del Pokémon activo en `mons` */
  activeIndex: number | null
  mons: BackedUpMon[]
  /** Expediciones en curso (las copias de antes no las tienen) */
  expeditions?: BackedUpExpedition[]
  /** Hora real de la copia: al rehacer la partida, el tiempo que pasó desde entonces cuenta como con la app cerrada */
  savedAt?: number
}

/** Lo mínimo para rehacer el equipo: especie, nivel, EXP, estrellas, dónde vive, quién es el activo y las expediciones */
export function backupTeam(s: GameState): TeamBackup {
  const indexOf = (uid: string | null) => s.owned.findIndex((m) => m.uid === uid)
  const active = indexOf(s.activeUid)
  return {
    format: TEAM_BACKUP_FORMAT,
    activeIndex: active >= 0 ? active : null,
    mons: s.owned.map(({ speciesId, level, exp, stars, ranch }) => ({ speciesId, level, exp, stars, ranch })),
    expeditions: s.expeditions
      .map(({ uid, routeId, durationMin, elapsedMin }) => ({ monIndex: indexOf(uid), routeId, durationMin, elapsedMin }))
      .filter((e) => e.monIndex >= 0),
    savedAt: s.lastTick,
  }
}

const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))

const knownRoute = (id: unknown) => {
  try {
    return typeof id === 'string' && !!route(id)
  } catch {
    return false
  }
}

/** Expediciones de la copia que encajan (una por Pokémon, ruta que existe, duración de las que hay) */
function parseExpeditions(raw: unknown, mons: number): BackedUpExpedition[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<number>()
  return raw.filter((e): e is BackedUpExpedition => {
    const ok =
      typeof e === 'object' &&
      e !== null &&
      isInt(e.monIndex, 0, mons - 1) &&
      !seen.has(e.monIndex) &&
      knownRoute(e.routeId) &&
      EXPEDITION_DURATIONS.includes(e.durationMin) &&
      typeof e.elapsedMin === 'number' &&
      e.elapsedMin >= 0 &&
      e.elapsedMin <= e.durationMin
    if (ok) seen.add(e.monIndex)
    return ok
  })
}

/** Lee una copia guardada; descarta los Pokémon que no sean válidos y devuelve null si no se reconoce el formato */
export function parseTeamBackup(raw: unknown): TeamBackup | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { format, activeIndex, mons, expeditions, savedAt } = raw as Partial<TeamBackup>
  if (format !== TEAM_BACKUP_FORMAT || !Array.isArray(mons)) return null
  const valid = mons.filter(
    (m): m is BackedUpMon =>
      typeof m === 'object' &&
      m !== null &&
      SPECIES_IDS.has(m.speciesId) &&
      isInt(m.level, 1, MAX_LEVEL) &&
      isInt(m.exp, 0, Number.MAX_SAFE_INTEGER) &&
      isInt(m.stars, 0, MAX_STARS) &&
      (m.ranch === null || isInt(m.ranch, 0, MAX_RANCHES - 1)),
  )
  // Si se descartó alguno, las posiciones (del activo y de las expediciones) ya no son fiables
  const intact = valid.length === mons.length
  const keepActive = intact && isInt(activeIndex, 0, valid.length - 1)
  return {
    format: TEAM_BACKUP_FORMAT,
    activeIndex: keepActive ? activeIndex : null,
    mons: valid,
    expeditions: intact ? parseExpeditions(expeditions, valid.length) : [],
    savedAt: Number.isFinite(savedAt) ? savedAt : undefined,
  }
}

/**
 * Rehace el equipo en una partida nueva (solo si aún no tiene Pokémon). Llegan con los PS al máximo, cuentan como
 * capturados y, como el jugador ya tenía equipo, se salta el tutorial. Se recuperan los ranchos que usaban y las
 * expediciones que estaban en curso; el tiempo desde la copia cuenta como con la app cerrada (lo aplica el primer tick)
 */
export function restoreTeam(s: GameState, backup: TeamBackup) {
  if (s.owned.length > 0 || backup.mons.length === 0) return
  for (const saved of backup.mons) {
    const mon = createMon(saved.speciesId, saved.level, saved.ranch)
    mon.exp = Math.min(saved.exp, expToNext(saved.level) - 1)
    mon.stars = saved.stars
    s.owned.push(mon)
    markCaught(s, saved.speciesId)
  }
  const lastRanch = Math.max(0, ...backup.mons.map((m) => m.ranch ?? 0))
  if (lastRanch > 0) s.upgrades.ranches = lastRanch
  // Sin activo fiable, el primero que no esté en la Caja
  const active = backup.activeIndex !== null ? s.owned[backup.activeIndex] : s.owned.find((m) => m.ranch !== null)
  s.activeUid = (active ?? s.owned[0]).uid
  s.tutorial = null
  for (const e of backup.expeditions ?? []) {
    s.expeditions.push({ uid: s.owned[e.monIndex].uid, routeId: e.routeId, durationMin: e.durationMin, elapsedMin: e.elapsedMin })
  }
  if (backup.savedAt !== undefined && backup.savedAt < s.lastTick) s.lastTick = backup.savedAt
}
