import { RANKING_SIZE, type DamageRankingEntry, type DamageRankingView } from '../../src/game/core/ranking'
import type { MonDamage } from '../../src/game/raid/online/damageTally'
import { RANKED_USERS } from './users'

// El ranking de daño a los jefes comunitarios en D1 (tablas raid_damage y damage_ranking,
// migrations/0009_damage_ranking.sql). El daño se suma al terminar cada pelea (una escritura por sala) y la foto se
// rehace cada hora junto a la del dinero, con los mismos permisos: apodo y «Aparecer en el ranking».

/**
 * Suma el daño de una pelea; solo cuenta el de los jugadores con cuenta (los anónimos no pueden salir en el ranking).
 * Si falla, la sala ya está guardada: se pierde ese daño, pero la pelea sigue
 */
export async function addDamage(db: D1Database, tally: MonDamage[]) {
  if (tally.length === 0) return
  await addDamageRows(db, tally).catch((e: unknown) => console.error('Ranking de daño: no se ha podido apuntar', e))
}

function addDamageRows(db: D1Database, tally: MonDamage[]) {
  return db.batch(
    tally.map((d) =>
      db
        .prepare(
          `INSERT INTO raid_damage (user_id, uid, species_id, damage)
           SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM users WHERE id = ?)
           ON CONFLICT (user_id, uid) DO UPDATE SET damage = damage + excluded.damage, species_id = excluded.species_id`,
        )
        .bind(d.playerId, d.uid, d.speciesId, d.damage, d.playerId),
    ),
  )
}

/** Sentencias que rehacen la foto: daño total de cada cuenta visible y su Pokémon que más ha hecho; los empates comparten puesto */
export const rebuildDamageStatements = (db: D1Database): D1PreparedStatement[] => [
  db.prepare('DELETE FROM damage_ranking'),
  db.prepare(
    `INSERT INTO damage_ranking (user_id, rank, damage, species_id, mon_damage)
     SELECT user_id, RANK() OVER (ORDER BY total DESC), total, species_id, damage FROM (
       SELECT raid_damage.user_id, raid_damage.species_id, raid_damage.damage,
         SUM(raid_damage.damage) OVER (PARTITION BY raid_damage.user_id) AS total,
         ROW_NUMBER() OVER (PARTITION BY raid_damage.user_id ORDER BY raid_damage.damage DESC) AS position
       FROM raid_damage JOIN users ON users.id = raid_damage.user_id
       WHERE ${RANKED_USERS}
     ) WHERE position = 1`,
  ),
]

interface EntryRow {
  rank: number
  nickname: string
  damage: number
  species_id: number
  mon_damage: number
  mine: number
}

/** La foto vista por la cuenta `userId`; `builtAt` es la de la foto del dinero, que se hace a la vez */
export async function loadDamageRanking(db: D1Database, userId: string, builtAt: number | null): Promise<DamageRankingView> {
  const [top, mine, count] = await Promise.all([
    db
      .prepare(
        `SELECT damage_ranking.rank, users.nickname, damage_ranking.damage, damage_ranking.species_id, damage_ranking.mon_damage,
           damage_ranking.user_id = ? AS mine
         FROM damage_ranking JOIN users ON users.id = damage_ranking.user_id
         WHERE ${RANKED_USERS} ORDER BY damage_ranking.rank, users.nickname LIMIT ?`,
      )
      .bind(userId, RANKING_SIZE)
      .all<EntryRow>(),
    db.prepare('SELECT rank, damage, species_id, mon_damage FROM damage_ranking WHERE user_id = ?').bind(userId).first<Omit<EntryRow, 'nickname' | 'mine'>>(),
    db.prepare(`SELECT COUNT(*) AS total FROM damage_ranking JOIN users ON users.id = damage_ranking.user_id WHERE ${RANKED_USERS}`).first<number>('total'),
  ])
  const topMon = (r: Pick<EntryRow, 'species_id' | 'mon_damage'>) => ({ speciesId: r.species_id, damage: r.mon_damage })
  const entries: DamageRankingEntry[] = top.results.map((r) => ({ rank: r.rank, nickname: r.nickname, damage: r.damage, topMon: topMon(r), mine: r.mine === 1 }))
  return { top: entries, mine: mine ? { rank: mine.rank, damage: mine.damage, topMon: topMon(mine) } : null, total: count ?? 0, builtAt }
}
