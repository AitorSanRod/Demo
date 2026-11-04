import { AuthCode, isValidPassword } from '../../src/game/core/accountRules'
import { accountInfo, createAuthToken, deleteUserSessions, TokenKind, updateUser, userByEmail, consumeAuthToken, type UserRow } from '../db/users'
import type { Env } from '../env'
import { json } from '../http'
import { MailKind, sendMail } from '../mail'
import { hashPassword, hashToken, newToken } from './crypto'
import { openSession } from './session'

// Los enlaces de los correos: confirmar la cuenta y recuperar la contraseña. El enlace lleva a la web con el token
// en el #, y la web lo manda aquí (net/account.ts).

/** Horas que vale el enlace de confirmar la cuenta */
const CONFIRM_HOURS = 48
/** Horas que vale el enlace de recuperar la contraseña */
const RESET_HOURS = 1
/** Milisegundos como mínimo entre dos correos a la misma cuenta (no se puede usar para mandar correos sin parar) */
const MAIL_COOLDOWN_MS = 60_000

const HOUR_MS = 60 * 60 * 1000
/** Cuánto vale cada enlace, qué correo lo lleva y con qué nombre va el token tras el # de la web */
const LINK: Record<TokenKind, { hours: number; mail: MailKind; fragment: string }> = {
  [TokenKind.Confirm]: { hours: CONFIRM_HOURS, mail: MailKind.Confirm, fragment: 'confirm' },
  [TokenKind.Reset]: { hours: RESET_HOURS, mail: MailKind.Reset, fragment: 'reset' },
}

/** Manda el correo con un enlace nuevo, salvo que se acabe de mandar otro a esa cuenta */
export async function mailLink(env: Env, request: Request, user: UserRow, kind: TokenKind, now: number) {
  if (now - user.last_mail_at < MAIL_COOLDOWN_MS) return
  const token = newToken()
  const { hours, mail, fragment } = LINK[kind]
  await createAuthToken(env.DB, await hashToken(token), user.id, kind, now + hours * HOUR_MS)
  await updateUser(env.DB, user.id, { last_mail_at: now })
  await sendMail(env, user.email, mail, `${new URL(request.url).origin}/#${fragment}=${token}`)
}

const tokenOf = (body: Record<string, unknown>) => (typeof body.token === 'string' ? body.token : '')

/** Abre la sesión de la cuenta y la devuelve */
export async function signedIn(env: Env, user: UserRow, now: number): Promise<Response> {
  return json({ user: accountInfo(user) }, 200, { 'Set-Cookie': await openSession(env.DB, user.id, now) })
}

export async function confirm(env: Env, body: Record<string, unknown>, now: number): Promise<Response> {
  const user = await consumeAuthToken(env.DB, await hashToken(tokenOf(body)), TokenKind.Confirm, now)
  if (!user) return json({ code: AuthCode.BadToken }, 400)
  await updateUser(env.DB, user.id, { confirmed: 1 })
  return signedIn(env, user, now)
}

/** Siempre responde lo mismo: no dice si hay una cuenta con ese email */
export async function forgot(env: Env, request: Request, email: string, now: number): Promise<Response> {
  const user = await userByEmail(env.DB, email)
  if (user) await mailLink(env, request, user, TokenKind.Reset, now)
  return json({ ok: true })
}

/** Contraseña nueva desde el enlace: también confirma el email y cierra las demás sesiones */
export async function reset(env: Env, body: Record<string, unknown>, now: number): Promise<Response> {
  if (!isValidPassword(body.password)) return json({ code: AuthCode.Invalid }, 400)
  const user = await consumeAuthToken(env.DB, await hashToken(tokenOf(body)), TokenKind.Reset, now)
  if (!user) return json({ code: AuthCode.BadToken }, 400)
  await updateUser(env.DB, user.id, { password_hash: await hashPassword(body.password), confirmed: 1, failed_logins: 0, locked_until: 0 })
  await deleteUserSessions(env.DB, user.id)
  return signedIn(env, user, now)
}
