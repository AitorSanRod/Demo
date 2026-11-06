import { vi } from 'vitest'
import { MailKind, sendMail } from '../mail'
import { testWorker } from './api'

// Cuentas de prueba en el Worker. El test que las use debe simular el correo (vi.mock de './mail' con sendMail: vi.fn())

export type Api = ReturnType<typeof testWorker>

/** Un jugador con cuenta en la base de datos de `env` (nueva si no se da), con apodo si se pide */
export async function player(email: string, nickname: string | null, env?: Api['env']): Promise<Api> {
  const api = testWorker(env)
  await api.call('/api/auth/signup', { body: { email, password: 'pikachu1234' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  if (nickname) await api.call('/api/auth/nickname', { body: { nickname } })
  return api
}

/** Id de la cuenta con sesión en `api` */
export const accountId = async (api: Api): Promise<string> => (await api.call('/api/auth/me')).data.user.id
