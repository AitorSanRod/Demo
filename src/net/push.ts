import { useSyncExternalStore } from 'react'
import { PUSH_TOPICS, type PushTopic } from '../game/core/push'
import { clientPushPlan } from '../game/core/pushPlan'
import { getState } from '../game/core/store'
import { subscribeAccount } from './account'
import { playerId } from './identity'

// Notificaciones push (worker/push): el navegador se suscribe con la clave pública del servidor y este manda los
// avisos aunque la app esté cerrada. El plan de expediciones y ruta lo manda la app al pasar a segundo plano y lo
// vacía al volver (con la app delante ya se ve todo en pantalla). La preferencia es del dispositivo, aparte de la partida.

const PUSH_API = '/api/push/'
const PREF_KEY = 'pokerancho-push'

/** Ready: todo bien; Denied: permiso bloqueado; Refused: el navegador no ha dejado suscribirse; Unavailable: el servidor no responde */
export const PushStatus = { Ready: 'ready', Unsupported: 'unsupported', Denied: 'denied', Refused: 'refused', Unavailable: 'unavailable' } as const
export type PushStatus = (typeof PushStatus)[keyof typeof PushStatus]

interface PushState {
  /** Temas activados en este dispositivo */
  topics: PushTopic[]
  status: PushStatus
  busy: boolean
}

function readTopics(): PushTopic[] {
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY) ?? '[]') as unknown
    return Array.isArray(saved) ? saved.filter((t): t is PushTopic => PUSH_TOPICS.includes(t)) : []
  } catch {
    return []
  }
}

function writeTopics(topics: PushTopic[]) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(topics))
  } catch {
    // Sin almacenamiento: la preferencia dura lo que la pestaña
  }
}

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

let current: PushState = {
  topics: readTopics(),
  status: !supported() ? PushStatus.Unsupported : Notification.permission === 'denied' ? PushStatus.Denied : PushStatus.Ready,
  busy: false,
}
const listeners = new Set<() => void>()

function update(patch: Partial<PushState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

const post = (action: string, body: object, keepalive = false) =>
  fetch(PUSH_API + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive })

const bytesOf = (b64url: string) => Uint8Array.from(atob(b64url.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))

/** La suscripción de este navegador, si la hay (sin service worker, p. ej. en desarrollo, no puede haber) */
async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker?.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

/** Da de alta (o al día) la suscripción con los temas, el jugador y la cuenta de ahora; devuelve si ha podido */
async function subscribeWith(topics: PushTopic[]): Promise<PushStatus> {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return PushStatus.Unsupported
  const keyRes = await fetch(PUSH_API + 'key').catch(() => null)
  if (!keyRes?.ok) return PushStatus.Unavailable
  const { publicKey } = (await keyRes.json()) as { publicKey: string }
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesOf(publicKey) }).catch(() => null))
  if (!subscription) return PushStatus.Refused
  const res = await post('subscribe', { subscription: subscription.toJSON(), playerId: playerId(), topics })
  return res.ok ? PushStatus.Ready : PushStatus.Unavailable
}

/** Activa los temas elegidos (sin ninguno, se da de baja); la primera vez pide permiso al navegador */
export async function setPushTopics(topics: PushTopic[]) {
  if (current.busy || current.status === PushStatus.Unsupported) return
  update({ busy: true })
  try {
    if (topics.length === 0) {
      const subscription = await currentSubscription()
      if (subscription) {
        await post('unsubscribe', { endpoint: subscription.endpoint }).catch(() => null)
        await subscription.unsubscribe()
      }
      writeTopics([])
      return update({ topics: [], status: PushStatus.Ready })
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission !== 'granted') return update({ status: PushStatus.Denied })
    const status = await subscribeWith(topics).catch(() => PushStatus.Unavailable)
    if (status === PushStatus.Ready) writeTopics(topics)
    update({ status, topics: status === PushStatus.Ready ? topics : current.topics })
  } finally {
    update({ busy: false })
  }
}

/** Manda al servidor el plan de avisos de la app (vacío: ninguno, la app está delante) */
async function sendPlan(withJobs: boolean) {
  if (current.topics.length === 0) return
  const subscription = await currentSubscription()
  if (!subscription) return
  const jobs = withJobs ? clientPushPlan(getState(), Date.now()).filter((j) => current.topics.includes(j.topic)) : []
  await post('jobs', { endpoint: subscription.endpoint, jobs }, true).catch(() => null)
}

/** Arranca (una vez, en App): plan al ocultarse la app, vaciarlo al volver y la suscripción al día con la cuenta */
export function startPush(): () => void {
  const refresh = () => {
    if (current.topics.length > 0 && Notification.permission === 'granted') void subscribeWith(current.topics).catch(() => null)
  }
  const onVisibility = () => void sendPlan(document.hidden)
  document.addEventListener('visibilitychange', onVisibility)
  const unsubscribe = supported() ? subscribeAccount(refresh) : () => {}
  if (supported()) {
    refresh()
    void sendPlan(false)
  }
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    unsubscribe()
  }
}

export function usePush(): PushState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
