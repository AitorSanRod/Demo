import { useEffect, useSyncExternalStore } from 'react'
import { act, getState } from '../game/core/store'
import { switchToLocalRaids, switchToServerRaids } from '../game/raid/raid'
import { DEFAULT_NICKNAME, RaidAction, type RaidFeed, type RotationFeed } from '../game/raid/online/protocol'
import type { Raid } from '../game/raid/raidRoom'
import { nickname, playerId } from './identity'
import { postFeed, RaidApiError } from './raidApi'

// La pestaña Raids según el servidor: por cada rotación de jefes, el del ciclo, la sala del frontal y la lista de salas;
// y la hora del servidor. Se consulta al abrir la app (para saber si hay servidor) y después solo con la pestaña en
// pantalla.

/** Milisegundos reales entre consultas con la pestaña en pantalla, mirando una sala ajena */
const FEED_WATCH_MS = 5_000
/** Lo mismo con un Pokémon propio en una sala: su pelea ya la consulta raidSync; aquí solo la lista */
const FEED_OWN_ROOM_MS = 15_000
/** Cada cuánto se mira si toca consultar */
const LOOP_MS = 1_000

export interface FeedState {
  feed: RaidFeed | null
  /** Hora real (de este dispositivo) a la que llegó `feed` */
  receivedAt: number
  /** Sala elegida en la lista para mirarla en el frontal; null: la que diga el servidor */
  watchRoomId: string | null
  failing: boolean
}

let current: FeedState = { feed: null, receivedAt: 0, watchRoomId: null, failing: false }
const listeners = new Set<() => void>()
let watchers = 0
let busy = false
let lastAt = 0
/** Ya se sabe si hay servidor (al menos una consulta ha llegado o ha fallado) */
let probed = false

function update(patch: Partial<FeedState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

const interval = () => (getState().raid ? FEED_OWN_ROOM_MS : FEED_WATCH_MS)

async function step() {
  const due = Date.now() - lastAt >= interval()
  if (busy || document.hidden || (probed && (watchers === 0 || !due))) return
  busy = true
  lastAt = Date.now()
  try {
    const feed = await postFeed({ action: RaidAction.Feed, playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME, watchRoomId: current.watchRoomId })
    update({ feed, receivedAt: Date.now(), failing: false })
    if (!getState().raidServer) act(switchToServerRaids)
  } catch (e) {
    if (!(e instanceof RaidApiError)) throw e
    update({ failing: true })
    // Si nunca ha contestado, no hay servidor (p. ej. npm run dev): todo en local, como antes
    if (!current.feed && getState().raidServer) act(switchToLocalRaids)
  } finally {
    probed = true
    busy = false
  }
}

/** Arranca las consultas (una vez, en App); devuelve cómo pararlas */
export function startRaidFeed(): () => void {
  const id = setInterval(step, LOOP_MS)
  void step()
  return () => clearInterval(id)
}

/** Mirar en el frontal una sala de la lista (null: volver a la que diga el servidor); se consulta enseguida */
export function watchRoom(roomId: string | null) {
  update({ watchRoomId: roomId })
  lastAt = 0
  void step()
}

/** La pestaña Raids está en pantalla: se consulta a menudo, y enseguida al abrirla */
export function useRaidFeed(): FeedState {
  useEffect(() => {
    watchers++
    lastAt = 0
    void step()
    return () => {
      watchers--
    }
  }, [])
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

/** Milisegundos reales que han pasado desde la última respuesta */
const sinceFeed = (state: FeedState) => Date.now() - state.receivedAt

/** Hora del servidor ahora mismo, según la última respuesta */
export const serverNow = (state: FeedState): number => (state.feed ? state.feed.serverNow + sinceFeed(state) : Date.now())

/**
 * La sala del frontal de una rotación, con su ronda avanzada lo que ha pasado desde la respuesta (para repartir los
 * golpes en pantalla)
 */
export function featuredRaid(state: FeedState, board: RotationFeed): Raid | null {
  const raid = board.featured?.raid
  return raid ? { ...raid, roundMsLeft: Math.max(0, raid.roundMsLeft - sinceFeed(state)) } : null
}
