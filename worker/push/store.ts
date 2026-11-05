import { CLIENT_TOPICS, type PushJob, type PushTopic } from '../../src/game/core/push'
import type { PushTarget } from './webPush'

// Suscripciones y avisos programados en D1 (tablas push_subscriptions y push_jobs)

/** A quién va un aviso: los navegadores de unos jugadores (id de raids), los de una cuenta o todos */
export type PushAudience = { playerIds: string[] } | { userId: string } | 'all'

export interface Subscriber {
  target: PushTarget
  playerId: string
  userId: string | null
  topics: PushTopic[]
}

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  player_id: string
  user_id: string | null
  topics: string
}

/** Solo los navegadores que tienen activado el tema (topics es un JSON con los temas) */
const WANTS_TOPIC = 'EXISTS (SELECT 1 FROM json_each(push_subscriptions.topics) WHERE value = ?)'

export async function saveSubscriber(db: D1Database, s: Subscriber, now: number) {
  await db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, player_id, user_id, topics, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, player_id = excluded.player_id,
         user_id = excluded.user_id, topics = excluded.topics, updated_at = excluded.updated_at`,
    )
    .bind(s.target.endpoint, s.target.p256dh, s.target.auth, s.playerId, s.userId, JSON.stringify(s.topics), now)
    .run()
}

export async function loadSubscriber(db: D1Database, endpoint: string): Promise<Subscriber | null> {
  const row = await db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).first<SubscriptionRow>()
  return (
    row && {
      target: { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
      playerId: row.player_id,
      userId: row.user_id,
      topics: JSON.parse(row.topics) as PushTopic[],
    }
  )
}

export const deleteSubscriber = (db: D1Database, endpoint: string) => db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run()

/** Sustituye los avisos que programa el móvil (expediciones y ruta) por los de su plan nuevo */
export async function replaceClientJobs(db: D1Database, endpoint: string, jobs: PushJob[]) {
  const marks = CLIENT_TOPICS.map(() => '?').join(', ')
  await db.batch([
    db.prepare(`DELETE FROM push_jobs WHERE endpoint = ? AND topic IN (${marks})`).bind(endpoint, ...CLIENT_TOPICS),
    ...jobs.map((j) =>
      db.prepare('INSERT OR REPLACE INTO push_jobs (endpoint, topic, key, due_at, title, body) VALUES (?, ?, ?, ?, ?, ?)').bind(endpoint, j.topic, j.key, j.dueAt, j.title, j.body),
    ),
  ])
}

/** Programa el aviso para los navegadores de `to` que tengan su tema activado (salvo los de `exceptPlayerId`) */
export async function enqueue(db: D1Database, to: PushAudience, job: PushJob, exceptPlayerId: string | null = null) {
  const where: string[] = [WANTS_TOPIC]
  const values: (string | number)[] = [job.topic]
  if (to !== 'all' && 'userId' in to) {
    where.push('user_id = ?')
    values.push(to.userId)
  } else if (to !== 'all') {
    const ids = to.playerIds.filter((id) => id !== exceptPlayerId)
    if (ids.length === 0) return
    where.push(`player_id IN (${ids.map(() => '?').join(', ')})`)
    values.push(...ids)
  }
  if (exceptPlayerId) {
    where.push('player_id <> ?')
    values.push(exceptPlayerId)
  }
  await db
    .prepare(`INSERT OR REPLACE INTO push_jobs (endpoint, topic, key, due_at, title, body) SELECT endpoint, ?, ?, ?, ?, ? FROM push_subscriptions WHERE ${where.join(' AND ')}`)
    .bind(job.topic, job.key, job.dueAt, job.title, job.body, ...values)
    .run()
}

export interface DueJob extends PushJob {
  target: PushTarget
}

/** Los avisos que ya tocan (de temas que el navegador sigue queriendo), los más antiguos primero */
export async function dueJobs(db: D1Database, now: number, limit: number): Promise<DueJob[]> {
  const { results } = await db
    .prepare(
      `SELECT push_jobs.*, p256dh, auth FROM push_jobs JOIN push_subscriptions USING (endpoint)
       WHERE due_at <= ? AND EXISTS (SELECT 1 FROM json_each(push_subscriptions.topics) WHERE value = push_jobs.topic)
       ORDER BY due_at LIMIT ?`,
    )
    .bind(now, limit)
    .all<{ endpoint: string; topic: PushTopic; key: string; due_at: number; title: string; body: string; p256dh: string; auth: string }>()
  return results.map((r) => ({ topic: r.topic, key: r.key, dueAt: r.due_at, title: r.title, body: r.body, target: { endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth } }))
}

export const deleteJob = (db: D1Database, j: DueJob) =>
  db.prepare('DELETE FROM push_jobs WHERE endpoint = ? AND topic = ? AND key = ?').bind(j.target.endpoint, j.topic, j.key).run()
