import { useSyncExternalStore } from 'react'
import type { TradeBoard } from '../game/trade/tradeProtocol'
import { account, AccountStatus, subscribeAccount } from './account'
import { fetchBoard } from './tradeApi'

// El tablón de intercambios tal y como lo vio la web la última vez: anuncios, los propios y lo pendiente de recoger en
// Notificaciones (su contador del menú). Se vuelve a pedir cada poco con la app delante y después de cada operación.

/** Milisegundos reales entre consultas con la app delante */
const REFRESH_EVERY_MS = 60_000

interface TradeBoardState {
  board: TradeBoard | null
  /** Especies buscadas (vacío: todos los anuncios) */
  search: number[]
  loading: boolean
  /** La última vez no se pudo hablar con el servidor */
  failing: boolean
  /** Diferencia entre la hora del servidor y la de aquí, para las cuentas atrás */
  clockOffset: number
}

let current: TradeBoardState = { board: null, search: [], loading: false, failing: false, clockOffset: 0 }
const listeners = new Set<() => void>()

function update(patch: Partial<TradeBoardState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

const signedIn = () => account().status === AccountStatus.SignedIn

/** Vuelve a pedir el tablón (con otra búsqueda si se da) */
export async function refreshTradeBoard(search: number[] = current.search) {
  if (!signedIn()) return update({ board: null, search })
  update({ loading: true, search })
  try {
    const board = await fetchBoard(search)
    update({ board, loading: false, failing: false, clockOffset: board.serverNow - Date.now() })
  } catch {
    update({ loading: false, failing: true })
  }
}

/** Arranca las consultas (una vez, en App); devuelve cómo pararlas */
export function startTradeBoard(): () => void {
  const unsubscribe = subscribeAccount(() => void refreshTradeBoard())
  const id = setInterval(() => !document.hidden && void refreshTradeBoard(), REFRESH_EVERY_MS)
  void refreshTradeBoard()
  return () => {
    unsubscribe()
    clearInterval(id)
  }
}

/** Hora del servidor ahora mismo (ms), según la última consulta */
export const serverNow = (): number => Date.now() + current.clockOffset

export const useTradeBoard = (): TradeBoardState =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
