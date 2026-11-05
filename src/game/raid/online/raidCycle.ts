import { RAID_BOSSES } from '../../../data/raidBosses'
import { RAID_COOLDOWN_MS } from '../raid'
import { CyclePhase } from './protocol'
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

export interface RaidCycle {
  /** Ciclos desde el principio; elige el jefe (raidBossAt) y la carpeta de sus salas */
  number: number
  /** Hora real (ms) a la que cayó el primer jefe del ciclo; null mientras ninguno ha caído */
  closingSince: number | null
  /** Sala que se ve cuando no hay nadie jugando; null hasta que se abre */
  mainRoomId: string | null
}

export const firstCycle = (): RaidCycle => ({ number: 0, closingSince: null, mainRoomId: null })

export const cycleBossIndex = (c: RaidCycle): number => c.number % RAID_BOSSES.length

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
 * Pasa al siguiente ciclo si toca. Si se pasa por el tope, las salas que aún peleaban se cierran (el jefe se escapa).
 * Devuelve las salas que ha cerrado, o null si el ciclo sigue
 */
export function advanceCycle(c: RaidCycle, rooms: SharedRoom[], now: number): SharedRoom[] | null {
  const opensAt = nextBossAt(c)
  if (opensAt === null || now < opensAt) return null
  const pending = rooms.filter(isPending)
  if (pending.length > 0 && now < opensAt + CYCLE_MAX_EXTRA_MS) return null
  for (const room of pending) room.closed = true
  Object.assign(c, { number: c.number + 1, closingSince: null, mainRoomId: null })
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
