import { AuthCode } from '../src/game/core/accountRules'
import { RankingCode, rankingDue } from '../src/game/core/ranking'
import { sessionUser } from './auth/session'
import { loadRanking, rankingBuiltAt, rebuildRanking } from './db/ranking'
import type { Env } from './env'
import { json } from './http'

// /api/ranking: el ranking de dinero para la cuenta con sesión. Solo lo ve quien tiene apodo y no se ha ocultado de él
// en Ajustes. La foto la rehace la tarea programada una vez cada hora (refreshRanking).

export async function rankingRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Solo GET' }, 405)
  const user = await sessionUser(env.DB, request, Date.now())
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  if (!user.nickname) return json({ code: RankingCode.NoNickname }, 403)
  if (!user.ranked) return json({ code: RankingCode.Hidden }, 403)
  return json({ ranking: await loadRanking(env.DB, user.id) })
}

/** Desde la tarea programada: rehace la foto si es de otra hora */
export async function refreshRanking(db: D1Database, now: number) {
  if (rankingDue(await rankingBuiltAt(db), now)) await rebuildRanking(db, now)
}
