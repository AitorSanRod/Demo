// Copia del equipo que sobrevive a los cambios de SAVE_VERSION.
// PROVISIONAL: solo mientras la partida viva en el navegador. Con servidor y base de datos, esto desaparece.
import { SPECIES } from '../../data/species'
import { markCaught } from '../collection/dex'
import { createMon } from '../team/mons'
import { expToNext, MAX_LEVEL, MAX_STARS } from '../team/stats'
import type { GameState } from './state'

/**
 * Versión del formato de la copia. Es independiente de SAVE_VERSION y solo debe subir si cambia la forma de
 * TeamBackup; entonces parseTeamBackup tiene que seguir leyendo los formatos anteriores.
 */
const TEAM_BACKUP_FORMAT = 1

interface BackedUpMon {
  speciesId: number
  level: number
  exp: number
  stars: number
}

export interface TeamBackup {
  format: typeof TEAM_BACKUP_FORMAT
  /** Posición del Pokémon activo en `mons` */
  activeIndex: number | null
  mons: BackedUpMon[]
}

/** Lo mínimo para rehacer el equipo: especie, nivel, EXP, estrellas y quién es el activo */
export function backupTeam(s: GameState): TeamBackup {
  const active = s.owned.findIndex((m) => m.uid === s.activeUid)
  return {
    format: TEAM_BACKUP_FORMAT,
    activeIndex: active >= 0 ? active : null,
    mons: s.owned.map(({ speciesId, level, exp, stars }) => ({ speciesId, level, exp, stars })),
  }
}

const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))

/** Lee una copia guardada; descarta los Pokémon que no sean válidos y devuelve null si no se reconoce el formato */
export function parseTeamBackup(raw: unknown): TeamBackup | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { format, activeIndex, mons } = raw as Partial<TeamBackup>
  if (format !== TEAM_BACKUP_FORMAT || !Array.isArray(mons)) return null
  const valid = mons.filter(
    (m): m is BackedUpMon =>
      typeof m === 'object' &&
      m !== null &&
      SPECIES_IDS.has(m.speciesId) &&
      isInt(m.level, 1, MAX_LEVEL) &&
      isInt(m.exp, 0, Number.MAX_SAFE_INTEGER) &&
      isInt(m.stars, 0, MAX_STARS),
  )
  // Si se descartó alguno, el índice del activo ya no es fiable
  const keepActive = valid.length === mons.length && isInt(activeIndex, 0, valid.length - 1)
  return { format: TEAM_BACKUP_FORMAT, activeIndex: keepActive ? activeIndex : null, mons: valid }
}

/**
 * Rehace el equipo en una partida nueva (solo si aún no tiene Pokémon). Llegan con los PS al máximo, cuentan como
 * capturados y, como el jugador ya tenía equipo, se salta el tutorial.
 */
export function restoreTeam(s: GameState, backup: TeamBackup) {
  if (s.owned.length > 0 || backup.mons.length === 0) return
  for (const saved of backup.mons) {
    const mon = createMon(saved.speciesId, saved.level)
    mon.exp = Math.min(saved.exp, expToNext(saved.level) - 1)
    mon.stars = saved.stars
    s.owned.push(mon)
    markCaught(s, saved.speciesId)
  }
  s.activeUid = s.owned[backup.activeIndex ?? 0].uid
  s.tutorial = null
}
