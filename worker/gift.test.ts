import { afterEach, describe, expect, it, vi } from 'vitest'
import { DAILY_GIFTS } from '../src/data/dailyGifts'
import { DAILY_GIFT_INTERVAL_MS } from '../src/game/collection/dailyGift'
import { MailKind, sendMail } from './mail'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))

async function signedIn(api = testWorker()) {
  await api.call('/api/auth/signup', { body: { email: 'brock@plateada.es', password: 'onix123456' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  return api
}

/** El reloj del servidor salta `ms` hacia delante */
const later = (ms: number) => vi.useFakeTimers({ now: Date.now() + ms, toFake: ['Date'] })

afterEach(() => vi.useRealTimers())

describe('obsequio diario en el servidor', () => {
  it('sin sesión no hay obsequio', async () => {
    expect((await testWorker().call('/api/gift')).status).toBe(401)
  })

  it('se recoge uno cada 24 h y cada vez el siguiente de la lista', async () => {
    const api = await signedIn()
    expect((await api.call('/api/gift')).data.state).toEqual({ claimed: 0, lastClaimAt: null })
    const first = await api.call('/api/gift', { body: {} })
    expect(first.data.gift).toEqual(DAILY_GIFTS[0])
    const early = await api.call('/api/gift', { body: {} })
    expect(early.status).toBe(409)
    expect(early.data.state.claimed).toBe(1)
    later(DAILY_GIFT_INTERVAL_MS)
    expect((await api.call('/api/gift', { body: {} })).data.gift).toEqual(DAILY_GIFTS[1 % DAILY_GIFTS.length])
  })

  it('solo se recoge desde la propia web', async () => {
    const api = await signedIn()
    expect((await api.call('/api/gift', { body: {}, origin: 'https://otra.web' })).status).toBe(403)
  })
})
