import { AuthCode, isValidPassword, normalizeEmail } from '../../src/game/core/accountRules'
import { createUser, TokenKind, updateUser, userByEmail } from '../db/users'
import type { Env } from '../env'
import { json } from '../http'
import { hashPassword, verifyPassword } from './crypto'
import { mailLink, signedIn } from './links'

// Crear la cuenta y entrar con email y contraseña

/** Intentos fallidos seguidos antes de bloquear la cuenta un rato */
const MAX_FAILED_LOGINS = 10
/** Minutos que se bloquea la cuenta tras MAX_FAILED_LOGINS fallos */
const LOCK_MINUTES = 15

function credentials(body: Record<string, unknown>): { email: string; password: string } | null {
  const email = normalizeEmail(body.email)
  return email && isValidPassword(body.password) ? { email, password: body.password } : null
}

/**
 * Crea la cuenta y manda el correo de confirmarla. Si ya existe sin confirmar, se cambia la contraseña y se vuelve a
 * mandar (quien la creó pudo equivocarse o perder el correo)
 */
export async function signup(env: Env, request: Request, body: Record<string, unknown>, now: number): Promise<Response> {
  const given = credentials(body)
  if (!given) return json({ code: AuthCode.Invalid }, 400)
  const existing = await userByEmail(env.DB, given.email)
  if (existing?.confirmed) return json({ code: AuthCode.Taken }, 409)
  const hash = await hashPassword(given.password)
  if (existing) await updateUser(env.DB, existing.id, { password_hash: hash })
  const user = existing ?? (await createUser(env.DB, given.email, hash, now))
  await mailLink(env, request, user, TokenKind.Confirm, now)
  return json({ ok: true })
}

/** Entrar. Sin confirmar el email no se puede (y se vuelve a mandar el correo); tras muchos fallos, se bloquea un rato */
export async function login(env: Env, request: Request, body: Record<string, unknown>, now: number): Promise<Response> {
  const given = credentials(body)
  const user = given && (await userByEmail(env.DB, given.email))
  if (!given || !user) return json({ code: AuthCode.BadCredentials }, 401)
  if (user.locked_until > now) return json({ code: AuthCode.Locked }, 429)
  if (!(await verifyPassword(given.password, user.password_hash))) {
    const failed = user.failed_logins + 1
    const locked = failed >= MAX_FAILED_LOGINS
    await updateUser(env.DB, user.id, { failed_logins: locked ? 0 : failed, locked_until: locked ? now + LOCK_MINUTES * 60_000 : 0 })
    return json({ code: AuthCode.BadCredentials }, 401)
  }
  if (!user.confirmed) {
    await mailLink(env, request, user, TokenKind.Confirm, now)
    return json({ code: AuthCode.NotConfirmed }, 403)
  }
  if (user.failed_logins > 0) await updateUser(env.DB, user.id, { failed_logins: 0 })
  return signedIn(env, user, now)
}
