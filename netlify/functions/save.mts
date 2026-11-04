import { getUser, verifyRequestOrigin } from '@netlify/identity'
import { MAX_SAVE_BYTES, parseUpload, type CloudSave } from '../../src/game/core/cloudSave'
import { loadSave, writeSave } from '../lib/saveStore'

// Partida en la nube de la cuenta con la que se ha entrado (Netlify Identity: la sesión viaja en la cookie nf_jwt y
// getUser la comprueba contra Identity). GET /api/save la devuelve; POST /api/save sube una encima de la revisión
// que el dispositivo vio por última vez: si en la nube hay otra más nueva, 409 con ella.

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

async function upload(request: Request, userId: string): Promise<Response> {
  // La sesión va en una cookie: solo se aceptan subidas desde la propia web
  try {
    verifyRequestOrigin(request)
  } catch {
    return json({ error: 'Origen no permitido' }, 403)
  }
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) return json({ error: 'Partida demasiado grande' }, 413)
  let body: unknown = null
  try {
    body = JSON.parse(text)
  } catch {
    // Se trata como petición no válida justo debajo
  }
  const up = parseUpload(body)
  if (!up) return json({ error: 'Petición no válida' }, 400)

  const before = await loadSave(userId)
  if ((before?.cloud.revision ?? null) !== up.baseRevision) return json({ cloud: before?.cloud ?? null }, 409)
  const cloud: CloudSave = { save: up.save, team: up.team, revision: (before?.cloud.revision ?? 0) + 1, updatedAt: Date.now() }
  if (!(await writeSave(userId, cloud, before))) return json({ cloud: (await loadSave(userId))?.cloud ?? null }, 409)
  return json({ revision: cloud.revision, updatedAt: cloud.updatedAt })
}

export default async (request: Request): Promise<Response> => {
  const user = await getUser()
  if (!user) return json({ error: 'Hay que iniciar sesión' }, 401)
  if (request.method === 'GET') return json({ cloud: (await loadSave(user.id))?.cloud ?? null })
  if (request.method === 'POST') return upload(request, user.id)
  return json({ error: 'Solo GET o POST' }, 405)
}

export const config = { path: '/api/save' }
