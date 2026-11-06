import type { AccountInfo } from '../../src/game/core/accountRules'

// Cuentas, sesiones y enlaces de los correos en D1 (tablas users, sessions, auth_tokens)

export interface UserRow {
  id: string
  email: string
  password_hash: string
  confirmed: number
  nickname: string | null
  /** 1 si quiere aparecer en el ranking (y verlo) */
  ranked: number
  failed_logins: number
  locked_until: number
  last_mail_at: number
}

/** Para qué sirve un enlace de correo */
export const TokenKind = { Confirm: 'confirm', Reset: 'reset' } as const
export type TokenKind = (typeof TokenKind)[keyof typeof TokenKind]

/** Condición SQL de las cuentas que salen en los rankings (y los ven): con apodo y sin ocultarse en Ajustes */
export const RANKED_USERS = 'users.ranked = 1 AND users.nickname IS NOT NULL'

export const accountInfo = (u: UserRow): AccountInfo => ({ id: u.id, email: u.email, nickname: u.nickname, ranked: u.ranked === 1 })

export const userByEmail = (db: D1Database, email: string) => db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()

export async function createUser(db: D1Database, email: string, passwordHash: string, now: number): Promise<UserRow> {
  const id = crypto.randomUUID()
  await db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').bind(id, email, passwordHash, now).run()
  return (await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>())!
}

/** Cambia campos de la cuenta (solo los nombres de columna de UserRow) */
export async function updateUser(db: D1Database, id: string, fields: Partial<Omit<UserRow, 'id' | 'email'>>) {
  const entries = Object.entries(fields)
  const set = entries.map(([column]) => `${column} = ?`).join(', ')
  await db.prepare(`UPDATE users SET ${set} WHERE id = ?`).bind(...entries.map(([, v]) => v), id).run()
}

export async function createSession(db: D1Database, tokenHash: string, userId: string, expiresAt: number, now: number) {
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(tokenHash, userId, expiresAt),
  ])
}

export const userBySession = (db: D1Database, tokenHash: string, now: number) =>
  db
    .prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?')
    .bind(tokenHash, now)
    .first<UserRow>()

export const deleteSession = (db: D1Database, tokenHash: string) => db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()

export const deleteUserSessions = (db: D1Database, userId: string) => db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()

/** Un enlace nuevo sustituye a los anteriores del mismo tipo */
export async function createAuthToken(db: D1Database, tokenHash: string, userId: string, kind: TokenKind, expiresAt: number) {
  await db.batch([
    db.prepare('DELETE FROM auth_tokens WHERE user_id = ? AND kind = ?').bind(userId, kind),
    db.prepare('INSERT INTO auth_tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)').bind(tokenHash, userId, kind, expiresAt),
  ])
}

/** Gasta el enlace: devuelve su cuenta si es de ese tipo y no ha caducado (y lo borra, que es de un solo uso) */
export async function consumeAuthToken(db: D1Database, tokenHash: string, kind: TokenKind, now: number): Promise<UserRow | null> {
  const user = await db
    .prepare('SELECT users.* FROM auth_tokens JOIN users ON users.id = auth_tokens.user_id WHERE token_hash = ? AND kind = ? AND expires_at > ?')
    .bind(tokenHash, kind, now)
    .first<UserRow>()
  await db.prepare('DELETE FROM auth_tokens WHERE token_hash = ?').bind(tokenHash).run()
  return user
}
