import { useEffect, useSyncExternalStore } from 'react'
import { act, getState } from '../game/core/store'
import { applyView, dropLink, forgetRoom, presenceKey, ROOM_SLOTS, roomAt, roomRequest } from '../game/raid/online/linkedRoom'
import { DEFAULT_NICKNAME, RaidAction, type RoomSlot } from '../game/raid/online/protocol'
import { nickname, playerId } from './identity'
import { postRaid, RaidApiError } from './raidApi'

// Mantiene las salas de la partida al día con el servidor: pide entrar en las que esperan sitio, consulta las
// enlazadas y avisa de las que se han dejado. Las consultas, solo con la app delante: cerrada, el servidor sigue
// jugando y al volver se consulta enseguida. Entrar se pide también con la app oculta, para que la parada no espere. Cada consulta gasta cuota del plan de Cloudflare: ver docs/servidor.md.

/** Milisegundos reales entre consultas de una sala mientras su pelea está en pantalla */
const WATCH_SYNC_MS = 5_000
/** Milisegundos reales entre consultas con la app abierta y la pelea fuera de pantalla (EXP, caída del jefe…) */
const BACKGROUND_SYNC_MS = 60_000
/** Cada cuánto se mira si toca alguna consulta */
const LOOP_MS = 1_000

let watchers = 0
let busy = false
const lastSync: Partial<Record<RoomSlot, number>> = {}

let online: boolean | null = null
const listeners = new Set<() => void>()
function setOnline(value: boolean) {
  if (online === value) return
  online = value
  listeners.forEach((l) => l())
}

const who = () => ({ playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME })
const syncEvery = () => (watchers > 0 ? WATCH_SYNC_MS : BACKGROUND_SYNC_MS)
const syncNow = () => ROOM_SLOTS.forEach((slot) => delete lastSync[slot])

async function syncSlot(slot: RoomSlot, now: number, hidden: boolean) {
  const req = roomRequest(getState(), slot)
  if (!req) return
  const joining = req.action === RaidAction.Join
  if (!joining && (hidden || now - (lastSync[slot] ?? 0) < syncEvery())) return
  lastSync[slot] = now
  const sentRoomId = joining ? null : req.roomId
  const presence = presenceKey(getState(), slot)
  try {
    const view = await postRaid({ ...req, ...who() })
    setOnline(true)
    act((s) => {
      // Si ha entrado o salido mientras, la respuesta ya no vale: la próxima consulta lo pondrá al día
      if (!joining && presenceKey(s, slot) !== presence) return
      const applied = applyView(s, slot, sentRoomId, view)
      if (joining && !applied && view) s.roomsToLeave.push(view.roomId)
    })
  } catch (e) {
    if (!(e instanceof RaidApiError)) throw e
    setOnline(false)
    // Sin servidor no se espera más: la sala se juega en local, como antes
    if (joining) act((s) => roomAt(s, slot)?.remote?.roomId === null && dropLink(s, slot))
  }
}

/** Avisa al servidor de las salas que se han dejado (retirarse de la parada); si falla, se reintenta más tarde */
async function flushLeaves() {
  for (const roomId of getState().roomsToLeave) {
    await postRaid({ action: RaidAction.Sync, roomId, mon: null, ...who() })
    act((s) => forgetRoom(s, roomId))
  }
}

let lastPlayerId: string | null = null

/**
 * Al entrar o salir de una cuenta cambia el id de jugador: sus Pokémon salen de las salas con el id anterior (la
 * próxima consulta los sienta con el nuevo)
 */
async function leaveAsPreviousPlayer() {
  const previous = lastPlayerId
  lastPlayerId = playerId()
  if (!previous || previous === lastPlayerId) return
  for (const slot of ROOM_SLOTS) {
    const req = roomRequest(getState(), slot)
    if (req?.action === RaidAction.Sync) await postRaid({ ...req, mon: null, playerId: previous, nickname: who().nickname })
  }
}

const ignoreNetwork = (e: unknown) => {
  if (!(e instanceof RaidApiError)) throw e
}

async function step() {
  if (busy) return
  busy = true
  const hidden = document.hidden
  try {
    if (!hidden) {
      await leaveAsPreviousPlayer().catch(ignoreNetwork)
      await flushLeaves().catch(ignoreNetwork)
    }
    const now = Date.now()
    for (const slot of ROOM_SLOTS) await syncSlot(slot, now, hidden)
  } finally {
    busy = false
  }
}

/** Arranca el bucle (una vez, en App); devuelve cómo pararlo */
export function startRaidSync(): () => void {
  const id = setInterval(step, LOOP_MS)
  const onVisible = () => {
    if (document.hidden) return
    syncNow()
    void step()
  }
  document.addEventListener('visibilitychange', onVisible)
  void step()
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** La pelea de una sala está en pantalla: se consulta más a menudo, y enseguida al abrirla */
export function useWatchRaid() {
  useEffect(() => {
    watchers++
    syncNow()
    return () => {
      watchers--
    }
  }, [])
}

/** Si la última consulta llegó al servidor (null: aún no se ha hecho ninguna) */
export function useRaidOnline(): boolean | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => online,
  )
}
