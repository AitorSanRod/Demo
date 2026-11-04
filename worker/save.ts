import { AuthCode } from '../src/game/core/accountRules'
import { MAX_SAVE_BYTES, parseUpload, type CloudSave } from '../src/game/core/cloudSave'
import { sessionUser } from './auth/session'
import { loadSave, writeSave } from './db/saves'
import type { Env } from './env'
import { json, readJson, sameOrigin } from './http'

// /api/save: la partida en la nube de la cuenta con sesión. GET la devuelve; POST sube una encima de la revisión que
// el dispositivo vio por última vez: si en la nube hay otra más nueva, 409 con ella.

async function upload(env: Env, request: Request, userId: string): Promise<Response> {
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const up = parseUpload(await readJson(request, MAX_SAVE_BYTES))
  if (!up) return json({ error: 'Petición no válida' }, 400)
  const cloud: CloudSave = { save: up.save, team: up.team, revision: (up.baseRevision ?? 0) + 1, updatedAt: Date.now() }
  if (await writeSave(env.DB, userId, cloud, up.baseRevision)) return json({ revision: cloud.revision, updatedAt: cloud.updatedAt })
  return json({ cloud: await loadSave(env.DB, userId) }, 409)
}

export async function saveRoute(request: Request, env: Env): Promise<Response> {
  const user = await sessionUser(env.DB, request, Date.now())
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  if (request.method === 'GET') return json({ cloud: await loadSave(env.DB, user.id) })
  if (request.method === 'POST') return upload(env, request, user.id)
  return json({ error: 'Solo GET o POST' }, 405)
}
