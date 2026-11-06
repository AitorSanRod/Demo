import { RankingCode, type RankingView } from '../game/core/ranking'

// El ranking de dinero (worker/ranking.ts): se pide al abrirlo desde el menú; el servidor lo rehace cada hora.

const RANKING_API = '/api/ranking'

/** Lo que trae una consulta: la foto, por qué no se puede ver o que no se ha podido conectar */
export type RankingResult = { view: RankingView } | { code: RankingCode } | { failed: true }

export async function fetchRanking(): Promise<RankingResult> {
  try {
    const res = await fetch(RANKING_API, { cache: 'no-store' })
    const body = (await res.json()) as { ranking?: RankingView; code?: string }
    if (body.ranking) return { view: body.ranking }
    if (Object.values<string>(RankingCode).includes(body.code ?? '')) return { code: body.code as RankingCode }
  } catch {
    // Sin conexión: se avisa abajo
  }
  return { failed: true }
}
