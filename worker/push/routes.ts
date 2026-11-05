import { AuthCode } from '../../src/game/core/accountRules'
import { parseClientJobs, parseTopics, PushTopic } from '../../src/game/core/push'
import { giftAvailableAt } from '../../src/game/collection/dailyGift'
import { sessionUser } from '../auth/session'
import { loadGiftState } from '../db/gifts'
import type { Env } from '../env'
import { json, readJson, sameOrigin } from '../http'
import { notifyNextGift } from './notify'
import { deleteSubscriber, loadSubscriber, replaceClientJobs, saveSubscriber } from './store'
import { parseVapidKey, type PushTarget } from './webPush'

// /api/push/*: GET key (la clave pública para suscribirse); POST subscribe (alta o cambio de temas), unsubscribe y
// jobs (el plan de avisos del móvil: expediciones y ruta). Sin cuenta también se puede: el obsequio, solo con ella.

/** Bytes como mucho de una petición de push */
const MAX_REQUEST_BYTES = 16 * 1024
const PLAYER_ID = /^[A-Za-z0-9-]{8,64}$/
const B64URL = /^[A-Za-z0-9_-]{16,200}$/
/** Letras como mucho de la dirección de un servicio de push */
const MAX_ENDPOINT = 600

type Body = Record<string, unknown>

/** La suscripción que manda el navegador (PushSubscription.toJSON()); null si no encaja */
function parseTarget(v: unknown): PushTarget | null {
  const sub = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  const endpoint = typeof sub?.endpoint === 'string' && sub.endpoint.length <= MAX_ENDPOINT ? sub.endpoint : ''
  const { p256dh, auth } = sub?.keys ?? {}
  if (!endpoint.startsWith('https://') || typeof p256dh !== 'string' || !B64URL.test(p256dh) || typeof auth !== 'string' || !B64URL.test(auth)) return null
  return { endpoint, p256dh, auth }
}

async function subscribe(env: Env, request: Request, body: Body, now: number): Promise<Response> {
  const target = parseTarget(body.subscription)
  const topics = parseTopics(body.topics)
  if (!target || !topics || typeof body.playerId !== 'string' || !PLAYER_ID.test(body.playerId)) return json({ error: 'Petición no válida' }, 400)
  const user = await sessionUser(env.DB, request, now)
  await saveSubscriber(env.DB, { target, playerId: body.playerId, userId: user?.id ?? null, topics }, now)
  // Con el aviso del obsequio recién activado, se programa el siguiente si aún no toca
  if (user && topics.includes(PushTopic.Gift)) {
    const state = await loadGiftState(env.DB, user.id)
    if (giftAvailableAt(state) > now) await notifyNextGift(env.DB, user.id, state)
  }
  return json({ ok: true })
}

async function jobs(env: Env, body: Body, now: number): Promise<Response> {
  const subscriber = typeof body.endpoint === 'string' ? await loadSubscriber(env.DB, body.endpoint) : null
  const plan = parseClientJobs(body.jobs, now)
  if (!subscriber || !plan) return json({ error: 'Petición no válida' }, 400)
  await replaceClientJobs(
    env.DB,
    subscriber.target.endpoint,
    plan.filter((j) => subscriber.topics.includes(j.topic)),
  )
  return json({ ok: true })
}

export async function pushRoute(request: Request, env: Env, action: string): Promise<Response> {
  const now = Date.now()
  if (request.method === 'GET' && action === 'key') {
    const vapid = parseVapidKey(env.VAPID_KEY)
    return vapid ? json({ publicKey: vapid.publicKey }) : json({ error: 'Las notificaciones no están configuradas' }, 503)
  }
  if (request.method !== 'POST') return json({ error: 'No existe' }, 404)
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const body = (await readJson(request, MAX_REQUEST_BYTES)) as Body | null
  if (!body || typeof body !== 'object') return json({ error: 'Petición no válida' }, 400)
  if (action === 'subscribe') return subscribe(env, request, body, now)
  if (action === 'jobs') return jobs(env, body, now)
  if (action === 'unsubscribe' && typeof body.endpoint === 'string') {
    await deleteSubscriber(env.DB, body.endpoint)
    return json({ ok: true })
  }
  return json({ error: 'No existe' }, 404)
}
