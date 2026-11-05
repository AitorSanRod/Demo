import { useEffect, useSyncExternalStore } from 'react'
import type { DailyGift } from '../data/dailyGifts'
import { applyGift, canClaimGift, type DailyGiftState } from '../game/collection/dailyGift'
import { act } from '../game/core/store'
import { account, AccountStatus, subscribeAccount } from './account'
import { saveNow } from './cloudSync'

// El obsequio diario de la cuenta (worker/gift.ts): el servidor decide cuál toca y cuándo; aquí se pregunta al entrar
// en la cuenta y al abrir el menú, y al recogerlo se suma a la partida y se sube enseguida a la nube.

const GIFT_API = '/api/gift'

interface GiftView {
  state: DailyGiftState | null
  /** Diferencia entre la hora del servidor y la de este dispositivo, para contar la espera igual */
  serverOffset: number
  failing: boolean
  /** Ya se ha avisado de que está sin recoger en esta apertura de la app (no se vuelve a avisar hasta la siguiente) */
  prompted: boolean
}

let current: GiftView = { state: null, serverOffset: 0, failing: false, prompted: false }
const listeners = new Set<() => void>()
let busy = false

function update(patch: Partial<GiftView>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

const signedIn = () => account().status === AccountStatus.SignedIn

/** Hora del servidor ahora mismo */
export const giftNow = (view: GiftView = current): number => Date.now() + view.serverOffset

interface GiftResponse {
  state: DailyGiftState
  serverNow: number
  gift?: DailyGift
}

async function call(method: 'GET' | 'POST'): Promise<GiftResponse | null> {
  try {
    const res = await fetch(GIFT_API, { method, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined })
    if (!res.ok && res.status !== 409) throw new Error(`${GIFT_API}: ${res.status}`)
    const body = (await res.json()) as GiftResponse
    update({ state: body.state, serverOffset: body.serverNow - Date.now(), failing: false })
    return body
  } catch {
    update({ failing: true })
    return null
  }
}

/** Vuelve a preguntar al servidor (sin cuenta no hay obsequio) */
export async function refreshGift() {
  if (!signedIn()) return update({ state: null })
  await call('GET')
}

/** Recoge el obsequio que toca: lo suma a la partida y la sube a la nube; devuelve el obsequio, o null si no tocaba */
export async function claimDailyGift(): Promise<DailyGift | null> {
  if (busy || !signedIn()) return null
  busy = true
  try {
    const body = await call('POST')
    if (!body?.gift) return null
    const gift = body.gift
    act((s) => applyGift(s, gift))
    void saveNow()
    return gift
  } finally {
    busy = false
  }
}

/** El aviso de al entrar ya se ha enseñado (se haya recogido o se haya dejado para más tarde) */
export const markGiftPrompted = () => update({ prompted: true })

/** Ya se puede recoger (para el aviso del menú) */
export const giftReady = (view: GiftView): boolean => !!view.state && canClaimGift(view.state, giftNow(view))

/** El obsequio de la cuenta; se pregunta al servidor al usarlo y cada vez que se entra o sale de la cuenta */
export function useDailyGift(): GiftView {
  useEffect(() => {
    void refreshGift()
    return subscribeAccount(() => void refreshGift())
  }, [])
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
