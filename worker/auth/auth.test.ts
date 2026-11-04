import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthCode } from '../../src/game/core/accountRules'
import { MailKind, sendMail } from '../mail'
import { testWorker } from '../test/api'

vi.mock('../mail', async (original) => ({ ...(await original<typeof import('../mail')>()), sendMail: vi.fn() }))

const EMAIL = 'ash@pueblo.es'
const PASSWORD = 'pikachu123'

/** El token del último correo de ese tipo (lo que el jugador abriría desde su bandeja) */
function lastLink(kind: MailKind): string {
  const call = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === kind).at(-1)!
  return call[3].split('=')[1]
}

/** Cuenta creada y confirmada desde el correo, con la sesión abierta */
async function confirmedAccount() {
  const api = testWorker()
  await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD } })
  await api.call('/api/auth/confirm', { body: { token: lastLink(MailKind.Confirm) } })
  return api
}

beforeEach(() => vi.mocked(sendMail).mockClear())

describe('cuentas', () => {
  it('al crear la cuenta se manda el correo de confirmar; sin confirmar no se puede entrar', async () => {
    const api = testWorker()
    expect((await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD } })).status).toBe(200)
    expect(sendMail).toHaveBeenCalledWith(api.env, EMAIL, MailKind.Confirm, expect.stringContaining('/#confirm='))
    expect((await api.call('/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })).data.code).toBe(AuthCode.NotConfirmed)
  })

  it('el enlace del correo confirma la cuenta y abre la sesión; solo vale una vez', async () => {
    const api = testWorker()
    await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD } })
    const token = lastLink(MailKind.Confirm)
    expect((await api.call('/api/auth/confirm', { body: { token } })).data.user.email).toBe(EMAIL)
    expect((await api.call('/api/auth/me')).data.user.email).toBe(EMAIL)
    expect((await api.call('/api/auth/confirm', { body: { token } })).data.code).toBe(AuthCode.BadToken)
  })

  it('entrar, salir y volver a entrar; con la contraseña mal, no', async () => {
    const api = await confirmedAccount()
    await api.call('/api/auth/logout', { body: {} })
    expect((await api.call('/api/auth/me')).data.user).toBeNull()
    expect((await api.call('/api/auth/login', { body: { email: EMAIL, password: 'otra-cosa' } })).data.code).toBe(AuthCode.BadCredentials)
    expect((await api.call('/api/auth/login', { body: { email: EMAIL.toUpperCase(), password: PASSWORD } })).status).toBe(200)
  })

  it('no se puede crear otra cuenta con un email ya confirmado', async () => {
    const api = await confirmedAccount()
    expect((await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD } })).data.code).toBe(AuthCode.Taken)
  })

  it('tras muchos fallos seguidos la cuenta se bloquea un rato', async () => {
    const api = await confirmedAccount()
    let last = 0
    for (let i = 0; i < 11; i++) last = (await api.call('/api/auth/login', { body: { email: EMAIL, password: 'mal-mal-mal' } })).status
    expect(last).toBe(429)
  })

  it('recuperar la contraseña: el enlace deja elegir otra, que es la que vale desde entonces', async () => {
    const api = await confirmedAccount()
    await api.call('/api/auth/logout', { body: {} })
    vi.useFakeTimers({ now: Date.now() + 120_000, toFake: ['Date'] })
    await api.call('/api/auth/forgot', { body: { email: EMAIL } })
    vi.useRealTimers()
    const reset = await api.call('/api/auth/reset', { body: { token: lastLink(MailKind.Reset), password: 'charmander9' } })
    expect(reset.data.user.email).toBe(EMAIL)
    expect((await api.call('/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })).status).toBe(401)
    expect((await api.call('/api/auth/login', { body: { email: EMAIL, password: 'charmander9' } })).status).toBe(200)
  })

  it('el apodo se guarda en la cuenta', async () => {
    const api = await confirmedAccount()
    await api.call('/api/auth/nickname', { body: { nickname: '  Ash  ' } })
    expect((await api.call('/api/auth/me')).data.user.nickname).toBe('Ash')
  })

  it('las peticiones desde otra web se rechazan', async () => {
    const api = testWorker()
    expect((await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD }, origin: 'https://otra.web' })).status).toBe(403)
    expect((await api.call('/api/auth/signup', { body: { email: EMAIL, password: PASSWORD }, origin: null })).status).toBe(403)
  })

  it('no admite emails ni contraseñas que no valgan', async () => {
    const api = testWorker()
    expect((await api.call('/api/auth/signup', { body: { email: 'no-es-email', password: PASSWORD } })).data.code).toBe(AuthCode.Invalid)
    expect((await api.call('/api/auth/signup', { body: { email: EMAIL, password: 'corta' } })).data.code).toBe(AuthCode.Invalid)
    expect((await api.call('/api/auth/constructor', { body: {} })).status).toBe(404)
  })
})
