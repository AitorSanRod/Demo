import { RANKING_ACTIVE_MS, RANKING_SIZE, type RankingEntry, type RankingView } from '../../src/game/core/ranking'
import { rebuildDamageStatements } from './damageRanking'
import { RANKED_USERS } from './users'

// El ranking de dinero en D1 (tablas ranking y ranking_meta, migrations/0008_ranking.sql). La foto sale del dinero de
// la partida en la nube de cada cuenta; al leerla se vuelve a mirar el apodo y si la cuenta sigue queriendo salir.

/**
 * Rehace las fotos del dinero y del daño (damageRanking.ts). La del dinero, con las cuentas visibles que han subido la
 * partida hace poco; los empates comparten puesto
 */
export async function rebuildRanking(db: D1Database, now: number) {
  await db.batch([
    db.prepare('DELETE FROM ranking'),
    db
      .prepare(
        `INSERT INTO ranking (user_id, rank, money)
         SELECT user_id, RANK() OVER (ORDER BY money DESC), money FROM (
           SELECT saves.user_id, CAST(json_extract(saves.data, '$.save.money') AS INTEGER) AS money
           FROM saves JOIN users ON users.id = saves.user_id
           WHERE ${RANKED_USERS} AND saves.updated_at >= ?
         ) WHERE money IS NOT NULL`,
      )
      .bind(now - RANKING_ACTIVE_MS),
    ...rebuildDamageStatements(db),
    db.prepare('INSERT INTO ranking_meta (id, built_at) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET built_at = excluded.built_at').bind(now),
  ])
}

export async function rankingBuiltAt(db: D1Database): Promise<number | null> {
  return db.prepare('SELECT built_at FROM ranking_meta WHERE id = 1').first<number>('built_at')
}

interface EntryRow {
  rank: number
  nickname: string
  money: number
  mine: number
}

/** La foto vista por la cuenta `userId` */
export async function loadRanking(db: D1Database, userId: string): Promise<RankingView> {
  const [top, mine, count, builtAt] = await Promise.all([
    db
      .prepare(
        `SELECT ranking.rank, users.nickname, ranking.money, ranking.user_id = ? AS mine
         FROM ranking JOIN users ON users.id = ranking.user_id
         WHERE ${RANKED_USERS} ORDER BY ranking.rank, users.nickname LIMIT ?`,
      )
      .bind(userId, RANKING_SIZE)
      .all<EntryRow>(),
    db.prepare('SELECT rank, money FROM ranking WHERE user_id = ?').bind(userId).first<{ rank: number; money: number }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM ranking JOIN users ON users.id = ranking.user_id WHERE ${RANKED_USERS}`).first<number>('total'),
    rankingBuiltAt(db),
  ])
  const entries: RankingEntry[] = top.results.map((r) => ({ rank: r.rank, nickname: r.nickname, money: r.money, mine: r.mine === 1 }))
  return { top: entries, mine: mine ?? null, total: count ?? 0, builtAt }
}
