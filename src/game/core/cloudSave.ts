import { backupFromSave, backupTeam, parseTeamBackup, restoreTeam, type TeamBackup } from './teamBackup'
import { initialState, restoreState, TutorialStep, type GameState } from './state'

// La partida en la nube de una cuenta (worker/save.ts). Gana la última que se sube: cada copia lleva una
// revisión y el servidor solo acepta subir encima de la que el dispositivo vio por última vez.

/** Bytes como mucho de una partida subida (la de un jugador avanzado ocupa unas decenas de KB) */
export const MAX_SAVE_BYTES = 1024 * 1024

/** La partida en la nube: la de esta versión y la copia del equipo, por si es de otra (ver teamBackup.ts) */
export interface CloudSave {
  save: GameState
  team: TeamBackup
  /** Sube en uno con cada copia aceptada */
  revision: number
  /** Hora real (ms) a la que se subió */
  updatedAt: number
}

/** Lo que el dispositivo recuerda de la nube: de qué cuenta es su partida y qué revisión vio por última vez */
export interface CloudLink {
  userId: string
  revision: number
}

export const CloudAction = { Upload: 'upload', Download: 'download', Ask: 'ask' } as const
export type CloudAction = (typeof CloudAction)[keyof typeof CloudAction]

/** Una partida recién empezada, aún sin inicial: no hay nada que perder si se cambia por la de la nube */
const isFreshGame = (s: GameState): boolean => s.tutorial === TutorialStep.Starter

/**
 * Qué hacer al conectar con la cuenta `userId`: sin copia en la nube, subir la de aquí; si la de aquí ya es de esa
 * cuenta, bajar la de la nube si otro dispositivo ha subido después y, si no, subir; si no, preguntar (salvo que la
 * de aquí esté sin empezar)
 */
export function cloudAction(link: CloudLink | null, userId: string, cloud: Pick<CloudSave, 'revision'> | null, local: GameState): CloudAction {
  if (!cloud) return CloudAction.Upload
  if (link?.userId === userId) return cloud.revision > link.revision ? CloudAction.Download : CloudAction.Upload
  return isFreshGame(local) ? CloudAction.Download : CloudAction.Ask
}

/** Lo que se sube: la partida y la copia del equipo */
export const cloudUpload = (s: GameState) => ({ save: s, team: backupTeam(s) })

/**
 * La partida guardada si es de esta versión; si no, una nueva con el equipo (y sus expediciones en curso) recuperado
 * de la propia partida guardada o, si de ella no sale, de su copia
 */
export function stateFromSaved(saved: unknown, team: unknown): GameState {
  const restored = saved && typeof saved === 'object' ? restoreState(saved as GameState) : null
  if (restored) return restored
  const fresh = initialState()
  const fromSave = parseTeamBackup(backupFromSave(saved))
  const backup = fromSave?.mons.length ? fromSave : parseTeamBackup(team)
  if (backup) restoreTeam(fresh, backup)
  return fresh
}

/** Lo que se enseña de una partida para elegir entre la de aquí y la de la nube */
export interface SaveSummary {
  mons: number
  topLevel: number
  money: number
  completedRoutes: number
  /** Hora real (ms) de la última vez que se jugó */
  playedAt: number
}

export function saveSummary(s: GameState): SaveSummary {
  return {
    mons: s.owned.length,
    topLevel: Math.max(0, ...s.owned.map((m) => m.level)),
    money: s.money,
    completedRoutes: s.completedRoutes.length,
    playedAt: s.lastTick,
  }
}

/** Subida que acepta el servidor: la revisión sobre la que se sube (null, la primera) y la partida */
interface SaveUpload {
  baseRevision: number | null
  save: GameState
  team: TeamBackup
}

/** Comprueba la forma de una subida (la partida es del propio jugador: solo se mira que sea una partida) */
export function parseUpload(body: unknown): SaveUpload | null {
  if (!body || typeof body !== 'object') return null
  const { baseRevision, save, team } = body as Record<string, unknown>
  const validBase = baseRevision === null || (Number.isInteger(baseRevision) && (baseRevision as number) >= 0)
  const validSave = !!save && typeof save === 'object' && Number.isInteger((save as GameState).version)
  const backup = parseTeamBackup(team)
  return validBase && validSave && backup ? { baseRevision: baseRevision as number | null, save: save as GameState, team: backup } : null
}
