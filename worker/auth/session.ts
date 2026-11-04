import { createSession, deleteSession, userBySession, type UserRow } from '../db/users'
import { hashToken, newToken } from './crypto'

// La sesión va en una cookie HttpOnly (la web no la puede leer) que el navegador manda sola a /api

const COOKIE = 'pkr_session'
/** Días que dura una sesión sin volver a entrar */
const SESSION_DAYS = 90
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

const cookie = (value: string, maxAgeS: number) => `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeS}`

function tokenOf(request: Request): string | null {
  const header = request.headers.get('Cookie') ?? ''
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))
  return match ? match.slice(COOKIE.length + 1) : null
}

/** Abre una sesión para la cuenta; devuelve la cabecera Set-Cookie */
export async function openSession(db: D1Database, userId: string, now: number): Promise<string> {
  const token = newToken()
  await createSession(db, await hashToken(token), userId, now + SESSION_MS, now)
  return cookie(token, SESSION_MS / 1000)
}

/** La cuenta de la sesión de la petición, o null si no hay sesión válida */
export async function sessionUser(db: D1Database, request: Request, now: number): Promise<UserRow | null> {
  const token = tokenOf(request)
  return token ? userBySession(db, await hashToken(token), now) : null
}

/** Cierra la sesión de la petición; devuelve la cabecera Set-Cookie que la borra del navegador */
export async function closeSession(db: D1Database, request: Request): Promise<string> {
  const token = tokenOf(request)
  if (token) await deleteSession(db, await hashToken(token))
  return cookie('', 0)
}
