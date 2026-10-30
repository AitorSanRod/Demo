import { route, type Route } from '../../data/maps'
import { rarityOf, species, type Rarity } from '../../data/species'
import { moneyReward, pieceReward, ticketReward } from '../battle/rewards'
import { isSeen, markSeen } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import { pickEncounter, randInt, type Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type Expedition, type GameState, type OwnedMon } from '../core/state'
import { gainExp, type LevelUpResult } from './stats'
import { upgradeLevel } from './upgrades'

/** Duraciones que se pueden elegir, en minutos de juego */
export const EXPEDITION_DURATIONS = [15, 60, 240]
/** Multiplicador de EXP, ₽, tickets y piezas según la duración en minutos, sobre lo que ya den sus combates */
const DURATION_REWARD_MULT: Record<number, number> = { 15: 1, 60: 2, 240: 4 }
/** Probabilidad, por combate, de descubrir (marcar como vista) una especie no vista, según su rareza */
export const DISCOVERY_CHANCE: Record<Rarity, number> = { common: 0.15, rare: 0.1, epic: 0.075, legendary: 0.05 }
/** Pokémon que pueden estar de expedición a la vez sin mejoras (cada mejora de la tienda suma 1) */
const BASE_EXPEDITION_SLOTS = 1
/** Combates por hora de expedición (en una ruta normal se libran unos 15) */
const BATTLES_PER_HOUR = 8
/** Probabilidad mínima de ganar cada combate, aunque el Pokémon sea muy débil para la ruta */
const MIN_WIN_RATE = 0.2

interface ExpeditionResult extends LevelUpResult {
  battles: number
  wins: number
  exp: number
  money: number
  tickets: number
  /** Especies de las piezas soltadas (una entrada por pieza) */
  pieces: number[]
  /** Especies vistas por primera vez en esta expedición */
  discovered: number[]
}

export const expeditionSlots = (s: GameState): number => BASE_EXPEDITION_SLOTS + upgradeLevel(s, 'expeditionSlots')

export function expeditionBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const place = monPlace(s, uid)
  if (place === 'run') return 'Está explorando una ruta.'
  if (place === MonPlace.Expedition) return 'Ya está de expedición.'
  if (s.expeditions.length >= expeditionSlots(s)) return 'No quedan huecos de expedición. Amplíalos en la Tienda.'
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

export function sendExpedition(s: GameState, uid: string, routeId: string, durationMin: number) {
  if (expeditionBlocker(s, uid) || !s.unlockedRoutes.includes(routeId)) return
  if (!EXPEDITION_DURATIONS.includes(durationMin)) return
  s.expeditions.push({ uid, routeId, durationMin, elapsedMin: 0 })
}

export function advanceExpeditions(s: GameState, minutes: number) {
  for (const e of s.expeditions) e.elapsedMin = Math.min(e.durationMin, e.elapsedMin + minutes)
}

export const isExpeditionDone = (e: Expedition): boolean => e.elapsedMin >= e.durationMin

export const expeditionBattles = (durationMin: number): number =>
  Math.max(1, Math.round((durationMin / 60) * BATTLES_PER_HOUR))

export const expeditionRewardMult = (durationMin: number): number => DURATION_REWARD_MULT[durationMin]

/** Marca como vista una especie nueva si se supera su probabilidad de descubrimiento; true si la descubre */
function rollDiscovery(s: GameState, enemyId: number, rng: Rng): boolean {
  if (isSeen(s, enemyId) || rng() >= DISCOVERY_CHANCE[rarityOf(species(enemyId))]) return false
  markSeen(s, enemyId)
  return true
}

/** Probabilidad de ganar cada combate: crece con el nivel del Pokémon frente al nivel medio de la ruta */
export function expeditionWinRate(mon: OwnedMon, r: Route): number {
  const routeLevel = (r.levels[0] + r.levels[1]) / 2
  return Math.min(1, Math.max(MIN_WIN_RATE, mon.level / routeLevel))
}

/** Recoge una expedición terminada: simula sus combates de forma resumida y entrega el premio, multiplicado según la duración. La EXP base es la de completar la ruta. */
export function collectExpedition(s: GameState, uid: string, rng: Rng = Math.random): ExpeditionResult | null {
  const e = s.expeditions.find((x) => x.uid === uid)
  const mon = findMon(s, uid)
  if (!e || !mon || !isExpeditionDone(e)) return null
  const r = route(e.routeId)
  const winRate = expeditionWinRate(mon, r)
  const mult = expeditionRewardMult(e.durationMin)
  const result = {
    battles: expeditionBattles(e.durationMin),
    wins: 0,
    exp: r.reward.exp * mult,
    money: 0,
    tickets: 0,
    pieces: [] as number[],
    discovered: [] as number[],
  }

  for (let i = 0; i < result.battles; i++) {
    const enemyId = pickEncounter(r.encounters, rng)
    const level = randInt(r.levels[0], r.levels[1], rng)
    if (rollDiscovery(s, enemyId, rng)) result.discovered.push(enemyId)
    if (rng() >= winRate) continue
    result.wins++
    result.money += moneyReward(level, rng) * mult
    result.tickets += ticketReward(enemyId, rng) * mult
    if (pieceReward(enemyId, rng)) result.pieces.push(...Array<number>(mult).fill(enemyId))
  }

  s.expeditions = s.expeditions.filter((x) => x !== e)
  s.money += result.money
  s.tickets += result.tickets
  for (const id of result.pieces) addPieces(s, id, 1)
  return { ...result, ...gainExp(mon, result.exp) }
}
