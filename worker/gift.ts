import { AuthCode } from '../src/game/core/accountRules'
import { giftAt } from '../src/game/collection/dailyGift'
import { sessionUser } from './auth/session'
import { claimGiftRow, loadGiftState } from './db/gifts'
import type { Env } from './env'
import { json, sameOrigin } from './http'
import { notifyNextGift } from './push/notify'

// /api/gift: el obsequio diario de la cuenta con sesión. GET dice cuántos lleva y cuándo puede recoger el siguiente;
// POST lo recoge (409 si aún no toca). La hora del servidor va en cada respuesta para que las cuentas atrás cuadren.

export async function giftRoute(request: Request, env: Env): Promise<Response> {
  const now = Date.now()
  const user = await sessionUser(env.DB, request, now)
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  if (request.method === 'GET') return json({ state: await loadGiftState(env.DB, user.id), serverNow: now })
  if (request.method !== 'POST') return json({ error: 'Solo GET o POST' }, 405)
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const state = await claimGiftRow(env.DB, user.id, now)
  if (!state) return json({ state: await loadGiftState(env.DB, user.id), serverNow: now }, 409)
  await notifyNextGift(env.DB, user.id, state)
  return json({ gift: giftAt(state.claimed - 1), state, serverNow: now })
}
