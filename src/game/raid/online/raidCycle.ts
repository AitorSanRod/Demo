import { RAID_BOSSES, type RaidBoss } from '../../../data/raidBosses'
import type { Rng } from '../../core/random'
import { RAID_COOLDOWN_MS } from '../raid'
import { CyclePhase, RaidRotation, RoomSlot, type TabChannel } from './protocol'
import { playersIn, type SharedRoom } from './sharedRoom'

// El jefe de la pestaña Raids lo decide el servidor, igual para todos: va por ciclos. En cada ciclo hay un jefe y
// varias salas peleando contra él (siempre una principal). Cuando cae en la primera sala, el ciclo se cierra: ya no se
// abren salas, empieza la espera y el frontal pasa a las salas que aún pelean. El siguiente jefe aparece cuando ha
// pasado la espera y no queda ninguna sala con jugadores en pie (o, como mucho, CYCLE_MAX_EXTRA_MS después).

/** Milisegundos reales que se espera, desde que cae el primer jefe del ciclo, para que pueda aparecer el siguiente */
export const CYCLE_COOLDOWN_MS = RAID_COOLDOWN_MS
/**
 * Milisegundos reales que, pasada la espera, se aguarda como mucho a las salas con jugadores que aún pelean (por si
 * alguna no puede acabar nunca); después el jefe se escapa de ellas y empieza el siguiente
 */
export const CYCLE_MAX_EXTRA_MS = 60 * 60_000

// Hay una rotación de ciclos de cada RaidRotation a la vez, cada una con su jefe: la ordenada sigue la lista de
// RAID_BOSSES y la de azar elige uno que no esté ya en la otra (ni repita el suyo) para que haya donde escoger.

export interface RaidCycle {
  rotation: RaidRotation
  /** Ciclos de la rotación desde el principio; nombra la carpeta de sus salas */
  number: number
  /** Posición en RAID_BOSSES del jefe del ciclo (se lee con módulo, por si la lista se acorta) */
  bossIndex: number
  /** Posición en RAID_BOSSES del jefe del ciclo siguiente: se sabe antes para enseñarlo durante la espera */
  nextBossIndex: number
  /** Hora real (ms) a la que cayó el primer jefe del ciclo; null mientras ninguno ha caído */
  closingSince: number | null
  /** Sala que se ve cuando no hay nadie jugando; null hasta que se abre */
  mainRoomId: string | null
}

const bossSlot = (index: number) => index % RAID_BOSSES.length

/**
 * El jefe que sigue a `current` en la rotación: el siguiente de la lista o, al azar, uno distinto de `current` y de los
 * de `taken` (los de la otra rotación); si no queda ninguno así, al menos distinto de `current`
 */
export function followingBoss(rotation: RaidRotation, current: number, taken: number[], rng: Rng): number {
  if (rotation === RaidRotation.Ordered) return bossSlot(current + 1)
  const all = RAID_BOSSES.map((_, i) => i)
  const fresh = all.filter((i) => i !== bossSlot(current) && !taken.includes(i))
  const pool = fresh.length > 0 ? fresh : all.filter((i) => i !== bossSlot(current))
  return pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : 0
}

/** Primer ciclo de la rotación; `taken`, los jefes de la otra (ver followingBoss) */
export function firstCycle(rotation: RaidRotation, taken: number[] = [], rng: Rng = Math.random): RaidCycle {
  const bossIndex = rotation === RaidRotation.Ordered ? 0 : followingBoss(rotation, -1, taken, rng)
  const nextBossIndex = followingBoss(rotation, bossIndex, taken, rng)
  return { rotation, number: 0, bossIndex, nextBossIndex, closingSince: null, mainRoomId: null }
}

export const cycleBossIndex = (c: RaidCycle): number => bossSlot(c.bossIndex)

export const nextCycleBossIndex = (c: RaidCycle): number => bossSlot(c.nextBossIndex)

/** Los jefes que tiene la rotación, el de ahora y el siguiente: la otra no los elige si puede evitarlo */
export const cycleBosses = (c: RaidCycle): number[] => [cycleBossIndex(c), nextCycleBossIndex(c)]

export const cycleBoss = (c: RaidCycle): RaidBoss => RAID_BOSSES[cycleBossIndex(c)]

/** La carpeta de las salas del ciclo */
export const cycleChannel = (c: RaidCycle): TabChannel => ({ slot: RoomSlot.Tab, rotation: c.rotation, cycle: c.number })

export const cyclePhase = (c: RaidCycle): CyclePhase => (c.closingSince === null ? CyclePhase.Active : CyclePhase.Closing)

/** Hora real a partir de la cual puede aparecer el siguiente jefe; null si el ciclo aún no se ha cerrado */
export const nextBossAt = (c: RaidCycle): number | null => (c.closingSince === null ? null : c.closingSince + CYCLE_COOLDOWN_MS)

/** Sala con jugadores y el jefe en pie: mientras quede alguna, el ciclo no pasa al siguiente */
export const isPending = (room: SharedRoom): boolean => !room.closed && room.raid.hp > 0 && playersIn(room) > 0

/** Ha caído el jefe en alguna sala del ciclo: se cierra (solo cuenta la primera caída) */
export function noteFalls(c: RaidCycle, rooms: SharedRoom[], now: number): boolean {
  if (c.closingSince !== null || !rooms.some((r) => r.raid.hp === 0)) return false
  c.closingSince = now
  return true
}

/**
 * Pasa al siguiente ciclo si toca (con `taken`, los jefes de la otra rotación, se elige el que vendrá después). Si se
 * pasa por el tope, las salas que aún peleaban se cierran (el jefe se escapa). Devuelve las salas que ha cerrado, o
 * null si el ciclo sigue
 */
export function advanceCycle(c: RaidCycle, rooms: SharedRoom[], now: number, taken: number[] = [], rng: Rng = Math.random): SharedRoom[] | null {
  const opensAt = nextBossAt(c)
  if (opensAt === null || now < opensAt) return null
  const pending = rooms.filter(isPending)
  if (pending.length > 0 && now < opensAt + CYCLE_MAX_EXTRA_MS) return null
  for (const room of pending) room.closed = true
  const bossIndex = c.nextBossIndex
  const nextBossIndex = followingBoss(c.rotation, bossIndex, taken, rng)
  Object.assign(c, { number: c.number + 1, bossIndex, nextBossIndex, closingSince: null, mainRoomId: null })
  return pending
}

/** Se puede entrar en la sala: en un ciclo abierto, cualquiera en pie; cerrándose, solo las que aún tienen jugadores */
export const isOpenFor = (c: RaidCycle, room: SharedRoom): boolean =>
  !room.closed && room.raid.hp > 0 && (c.closingSince === null || playersIn(room) > 0)

/**
 * La sala del frontal: la que el jugador ha elegido mirar si sigue en pie; si no, la que tenga más jugadores; si no
 * hay nadie, la principal (solo con el ciclo abierto). null: no queda ninguna, se espera al siguiente jefe
 */
export function featuredRoom(c: RaidCycle, rooms: SharedRoom[], watchRoomId: string | null): SharedRoom | null {
  const open = rooms.filter((r) => isOpenFor(c, r))
  const watched = open.find((r) => r.id === watchRoomId)
  if (watched) return watched
  const busiest = [...open].sort((a, b) => playersIn(b) - playersIn(a))[0]
  if (busiest && playersIn(busiest) > 0) return busiest
  return open.find((r) => r.id === c.mainRoomId) ?? null
}
