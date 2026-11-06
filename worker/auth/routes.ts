import { AuthCode, normalizeEmail } from '../../src/game/core/accountRules'
import { cleanNickname } from '../../src/game/raid/online/requests'
import { accountInfo, updateUser } from '../db/users'
import type { Env } from '../env'
import { json, readJson, sameOrigin } from '../http'
import { login, signup } from './credentials'
import { confirm, forgot, reset } from './links'
import { closeSession, sessionUser } from './session'

// /api/auth/*: cuentas con email y contraseña. GET me; POST signup, login, logout, confirm, forgot, reset, nickname,
// ranked (aparecer o no en el ranking).

/** Bytes como mucho de una petición de cuenta */
const MAX_REQUEST_BYTES = 4 * 1024

type Body = Record<string, unknown>

async function me(env: Env, request: Request, now: number): Promise<Response> {
  const user = await sessionUser(env.DB, request, now)
  return json({ user: user && accountInfo(user) })
}

async function logout(env: Env, request: Request): Promise<Response> {
  return json({ ok: true }, 200, { 'Set-Cookie': await closeSession(env.DB, request) })
}

async function nickname(env: Env, request: Request, body: Body, now: number): Promise<Response> {
  const user = await sessionUser(env.DB, request, now)
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  await updateUser(env.DB, user.id, { nickname: cleanNickname(body.nickname) })
  return json({ ok: true })
}

async function ranked(env: Env, request: Request, body: Body, now: number): Promise<Response> {
  const user = await sessionUser(env.DB, request, now)
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  if (typeof body.ranked !== 'boolean') return json({ code: AuthCode.Invalid }, 400)
  await updateUser(env.DB, user.id, { ranked: body.ranked ? 1 : 0 })
  return json({ user: accountInfo({ ...user, ranked: body.ranked ? 1 : 0 }) })
}

const POST_ROUTES: Record<string, (env: Env, request: Request, body: Body, now: number) => Promise<Response>> = {
  signup,
  login,
  logout: (env, request) => logout(env, request),
  confirm: (env, _request, body, now) => confirm(env, body, now),
  forgot: (env, request, body, now) => {
    const email = normalizeEmail(body.email)
    return email ? forgot(env, request, email, now) : Promise.resolve(json({ code: AuthCode.Invalid }, 400))
  },
  reset: (env, _request, body, now) => reset(env, body, now),
  nickname,
  ranked,
}

export async function authRoute(request: Request, env: Env, action: string): Promise<Response> {
  const now = Date.now()
  if (request.method === 'GET' && action === 'me') return me(env, request, now)
  const route = Object.hasOwn(POST_ROUTES, action) ? POST_ROUTES[action] : null
  if (request.method !== 'POST' || !route) return json({ error: 'No existe' }, 404)
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const body = await readJson(request, MAX_REQUEST_BYTES)
  if (!body || typeof body !== 'object') return json({ code: AuthCode.Invalid }, 400)
  return route(env, request, body as Body, now)
}
