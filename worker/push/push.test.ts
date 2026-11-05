import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DAILY_GIFT_INTERVAL_MS } from '../../src/game/collection/dailyGift'
import { PUSH_TOPICS, PushTopic } from '../../src/game/core/push'
import { toBase64Url } from '../base64url'
import worker from '../index'
import { MailKind, sendMail } from '../mail'
import { testWorker } from '../test/api'

vi.mock('../mail', async (original) => ({ ...(await original<typeof import('../mail')>()), sendMail: vi.fn() }))

const ENDPOINT = 'https://push.example.com/send/abc123'
const PLAYER = 'player-push-0001'

/** Un Worker de pruebas con claves VAPID y una suscripción de navegador inventada */
async function pushWorker() {
  const api = testWorker()
  const vapid = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])) as CryptoKeyPair
  api.env.VAPID_KEY = JSON.stringify(await crypto.subtle.exportKey('jwk', vapid.privateKey))
  const ua = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const subscription = {
    endpoint: ENDPOINT,
    keys: { p256dh: toBase64Url(new Uint8Array((await crypto.subtle.exportKey('raw', ua.publicKey)) as ArrayBuffer)), auth: toBase64Url(crypto.getRandomValues(new Uint8Array(16))) },
  }
  const subscribe = (topics = PUSH_TOPICS) => api.call('/api/push/subscribe', { body: { subscription, playerId: PLAYER, topics } })
  const tick = () => worker.scheduled({} as ScheduledController, api.env)
  return { api, subscribe, tick }
}

/** Lo que reciben los servicios de push (fetch a sus direcciones) */
const pushService = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 201 }))

beforeEach(() => {
  pushService.mockClear()
  vi.stubGlobal('fetch', pushService)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const job = (dueAt: number) => ({ topic: PushTopic.Expedition, key: 'mon1', dueAt, title: '¡Ha vuelto!', body: 'Expedición terminada' })

describe('notificaciones push', () => {
  it('la web pide la clave pública para suscribirse', async () => {
    const { api } = await pushWorker()
    expect((await api.call('/api/push/key')).data.publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/)
  })

  it('el aviso del plan del móvil sale cuando toca, cifrado y firmado, y una sola vez', async () => {
    const { api, subscribe, tick } = await pushWorker()
    await subscribe()
    await api.call('/api/push/jobs', { body: { endpoint: ENDPOINT, jobs: [job(Date.now() + 60_000)] } })
    await tick()
    expect(pushService).not.toHaveBeenCalled()
    vi.useFakeTimers({ now: Date.now() + 61_000, toFake: ['Date'] })
    await tick()
    expect(pushService).toHaveBeenCalledTimes(1)
    const [url, init] = pushService.mock.calls[0]
    expect(url).toBe(ENDPOINT)
    expect(init?.headers).toMatchObject({ 'Content-Encoding': 'aes128gcm', Authorization: expect.stringMatching(/^vapid t=/) })
    await tick()
    expect(pushService).toHaveBeenCalledTimes(1)
  })

  it('sin el tema activado no se programa nada de él', async () => {
    const { api, subscribe, tick } = await pushWorker()
    await subscribe([PushTopic.Gift])
    await api.call('/api/push/jobs', { body: { endpoint: ENDPOINT, jobs: [job(Date.now())] } })
    await tick()
    expect(pushService).not.toHaveBeenCalled()
  })

  it('si el navegador ya no tiene la suscripción, se borra', async () => {
    const { api, subscribe, tick } = await pushWorker()
    await subscribe()
    await api.call('/api/push/jobs', { body: { endpoint: ENDPOINT, jobs: [job(Date.now())] } })
    pushService.mockResolvedValueOnce(new Response(null, { status: 410 }))
    await tick()
    expect((await api.call('/api/push/jobs', { body: { endpoint: ENDPOINT, jobs: [] } })).status).toBe(400)
  })

  it('al recoger el obsequio se programa el aviso del siguiente', async () => {
    const { api, subscribe, tick } = await pushWorker()
    await api.call('/api/auth/signup', { body: { email: 'erika@azulona.es', password: 'gloom12345' } })
    await api.call('/api/auth/confirm', { body: { token: vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1] } })
    await subscribe()
    await api.call('/api/gift', { body: {} })
    vi.useFakeTimers({ now: Date.now() + DAILY_GIFT_INTERVAL_MS, toFake: ['Date'] })
    await tick()
    expect(pushService.mock.calls.some(([url]) => url === ENDPOINT)).toBe(true)
  })
})
