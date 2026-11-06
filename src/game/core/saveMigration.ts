import { route } from '../../data/maps'
import { RANCH_TYPES } from '../../data/ranchTypes'
import { SPECIES } from '../../data/species'
import { Stone } from '../../data/stones'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon } from '../team/mons'
import { expToNext, MAX_LEVEL, MAX_STARS, maxHp } from '../team/stats'
import { UPGRADES } from '../team/upgrades'
import { initialState, SAVE_VERSION, TutorialStep, type GameState, type OwnedMon } from './state'

// Una partida guardada con otra versión del juego no se tira: se pasa por los pasos de SAVE_MIGRATIONS (los cambios
// de significado) y después se rescata campo a campo todo lo que encaje con la forma de ahora. Lo que ya no existe en
// el juego (una especie o una ruta quitadas) se descarta; los campos nuevos toman su valor inicial. Solo se pierde lo
// que estaba a medias (IN_PROGRESS), porque depende de reglas que pueden haber cambiado.

type Save = Record<string, unknown>

/**
 * Pasos de migración: SAVE_MIGRATIONS[v] convierte una partida de la versión v en una de la v + 1. Solo hace falta
 * cuando un campo cambia de nombre o de significado; los campos nuevos o quitados ya los resuelve el rescate
 */
export const SAVE_MIGRATIONS: Partial<Record<number, (save: Save) => void>> = {}

/** Lo que se descarta al cambiar de versión: la ruta y la sala de raid en curso (el Pokémon vuelve al rancho) */
const IN_PROGRESS: (keyof GameState)[] = ['run', 'raids', 'raidServer', 'timeScale']
/** Ranchos que puede llegar a tener el jugador: el primero más todos los de la tienda */
const MAX_RANCHES = 1 + UPGRADES.ranches.prices.length

const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))
const isRecord = (v: unknown): v is Save => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const isSpecies = (v: unknown): v is number => SPECIES_IDS.has(v as number)
const isRoute = (v: unknown): v is string => {
  try {
    return typeof v === 'string' && !!route(v)
  } catch {
    return false
  }
}

/** Lista sin repetir de los valores que valen */
const listOf = <T>(v: unknown, valid: (x: unknown) => x is T): T[] | undefined => (Array.isArray(v) ? [...new Set(v.filter(valid))] : undefined)

/** Tabla clave → cantidad con solo las claves que valen y cantidades enteras no negativas */
function countsOf(v: unknown, validKey: (k: string) => boolean, max = Number.MAX_SAFE_INTEGER): Record<string, number> | undefined {
  if (!isRecord(v)) return undefined
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, number] => validKey(e[0]) && isInt(e[1], 0, max)))
}

/** Un Pokémon guardado, con la forma de ahora: lo que falte, de un Pokémon nuevo; lo que no encaje, se arregla o se descarta */
function salvageMon(v: unknown): OwnedMon | null {
  if (!isRecord(v) || !isSpecies(v.speciesId) || !isInt(v.level, 1, MAX_LEVEL) || typeof v.uid !== 'string' || !v.uid) return null
  const ranch = v.ranch === null || isInt(v.ranch, 0, MAX_RANCHES - 1) ? v.ranch : 0
  const mon = { ...createMon(v.speciesId, v.level, ranch), uid: v.uid } as OwnedMon & Save
  for (const key of Object.keys(mon)) if (typeof v[key] === typeof mon[key] && v[key] !== null) mon[key] = v[key]
  mon.exp = isInt(v.exp) ? Math.min(v.exp, expToNext(mon.level) - 1) : 0
  mon.stars = isInt(v.stars, 0, MAX_STARS) ? v.stars : 0
  mon.hp = typeof v.hp === 'number' && v.hp >= 0 ? Math.min(v.hp, maxHp(mon)) : maxHp(mon)
  mon.spot = isRecord(v.spot) && typeof v.spot.x === 'number' && typeof v.spot.y === 'number' ? { x: v.spot.x, y: v.spot.y } : null
  return mon
}

/** Un premio de raid pendiente con la forma de ahora (lo que le falte, a 0): que no se pierda ni salga NaN al recogerlo */
function salvagePrize(v: unknown) {
  if (!isRecord(v) || !isSpecies(v.bossSpeciesId)) return null
  const n = (x: unknown) => (isInt(x) ? x : 0)
  return { bossSpeciesId: v.bossSpeciesId, uid: typeof v.uid === 'string' ? v.uid : '', money: n(v.money), tickets: n(v.tickets), pieces: n(v.pieces), exp: n(v.exp) }
}

/** Reglas de los campos que hay que comprobar a fondo; los demás se rescatan si tienen la misma forma que el inicial */
const RULES: Partial<Record<keyof GameState, (v: unknown) => unknown>> = {
  money: (v) => (isInt(v) ? v : undefined),
  tickets: (v) => (isInt(v) ? v : undefined),
  missingnoShards: (v) => (isInt(v) ? v : undefined),
  tradeStamp: (v) => (isInt(v) ? v : undefined),
  seen: (v) => listOf(v, isSpecies),
  caught: (v) => listOf(v, isSpecies),
  favorites: (v) => listOf(v, isSpecies),
  pieces: (v) => countsOf(v, (k) => isSpecies(Number(k))),
  upgrades: (v) => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, n]) => k in UPGRADES && isInt(n, 0, UPGRADES[k as keyof typeof UPGRADES].prices.length))) : undefined),
  ranchTypeItems: (v) => countsOf(v, (k) => k in RANCH_TYPES),
  ranchTypeOf: (v) => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, t]) => isInt(Number(k), 0, MAX_RANCHES - 1) && typeof t === 'string' && t in RANCH_TYPES)) : undefined),
  stones: (v) => countsOf(v, (k) => (Object.values(Stone) as string[]).includes(k)),
  tutorial: (v) => (v === null || (Object.values(TutorialStep) as unknown[]).includes(v) ? v : undefined),
  unlockedRoutes: (v) => listOf(v, isRoute),
  completedRoutes: (v) => listOf(v, isRoute),
  owned: (v) => (Array.isArray(v) ? v.map(salvageMon).filter((m): m is OwnedMon => m !== null) : undefined),
  raidPrizes: (v) => (Array.isArray(v) ? v.map(salvagePrize).filter((x) => x !== null) : undefined),
  routeRaidStreaks: (v) =>
    isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, r]) => isRecord(r) && isInt(r.count) && typeof r.lastAt === 'number')) : undefined,
  roomsToLeave: (v) => listOf(v, (x): x is string => typeof x === 'string'),
  lastTick: (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(v, Date.now()) : undefined),
}

/** Mismo tipo de valor que el inicial (número, texto, lista, tabla…): para los campos sin regla propia */
function sameShape(initial: unknown, v: unknown): boolean {
  if (Array.isArray(initial)) return Array.isArray(v)
  if (initial === null) return v === null || typeof v === 'object'
  return typeof v === typeof initial && !Array.isArray(v)
}

/** Lo que depende de otros campos: Pokémon únicos, activo y expediciones de Pokémon que existen, ranchos comprados */
function linkUp(s: GameState) {
  const seenUids = new Set<string>()
  s.owned = s.owned.filter((m) => !seenUids.has(m.uid) && seenUids.add(m.uid))
  if (!s.owned.some((m) => m.uid === s.activeUid)) s.activeUid = (s.owned.find((m) => m.ranch !== null) ?? s.owned[0])?.uid ?? null
  s.expeditions = s.expeditions.filter(
    (e) =>
      isRecord(e) &&
      seenUids.has(e.uid) &&
      isRoute(e.routeId) &&
      EXPEDITION_DURATIONS.includes(e.durationMin) &&
      typeof e.elapsedMin === 'number' &&
      e.elapsedMin >= 0,
  )
  s.caught = [...new Set([...s.caught, ...s.owned.map((m) => m.speciesId)])]
  s.seen = [...new Set([...s.seen, ...s.caught])]
  s.unlockedRoutes = [...new Set([...initialState().unlockedRoutes, ...s.unlockedRoutes, ...s.completedRoutes])]
  const lastRanch = Math.max(0, ...s.owned.map((m) => m.ranch ?? 0))
  if (lastRanch > (s.upgrades.ranches ?? 0)) s.upgrades.ranches = lastRanch
  if (s.owned.length > 0 && s.tutorial === TutorialStep.Starter) s.tutorial = null
}

/** La partida de otra versión pasada a esta, sin perder nada de lo que siga existiendo; null si no es una partida */
export function migrateSave(saved: unknown): GameState | null {
  if (!isRecord(saved) || !isInt(saved.version)) return null
  const save = structuredClone(saved)
  for (let v = save.version as number; v < SAVE_VERSION; v++) SAVE_MIGRATIONS[v]?.(save)
  const s = initialState()
  const fields = s as unknown as Save
  for (const key of Object.keys(s) as (keyof GameState)[]) {
    if (key === 'version' || IN_PROGRESS.includes(key) || !(key in save)) continue
    const rule = RULES[key]
    const value = rule ? rule(save[key]) : sameShape(s[key], save[key]) ? save[key] : undefined
    if (value !== undefined) fields[key] = value
  }
  linkUp(s)
  return s
}
