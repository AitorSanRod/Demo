import { fromBase64Url, toBase64Url } from '../base64url'

// Contraseñas y tokens con la Web Crypto del Worker. Nunca se guarda una contraseña ni un token: solo su hash.

/**
 * Iteraciones de PBKDF2-SHA256 de las contraseñas nuevas: el máximo que admite Cloudflare. Cada hash guarda las suyas,
 * así que bajarlas (si el plan gratuito se queda corto de CPU al entrar) no invalida las contraseñas ya guardadas
 */
const PASSWORD_ITERATIONS = 100_000
/** Bytes de sal de cada contraseña */
const SALT_BYTES = 16
/** Bits del hash de una contraseña */
const HASH_BITS = 256
/** Bytes al azar de un token (sesión o enlace de correo) */
const TOKEN_BYTES = 32

const SCHEME = 'pbkdf2-sha256'


async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, HASH_BITS)
  return new Uint8Array(bits)
}

/** Compara sin cortar en el primer byte distinto, para no dar pistas por el tiempo que tarda */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** `pbkdf2-sha256$<iteraciones>$<sal>$<hash>` */
export async function hashPassword(password: string, iterations = PASSWORD_ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  return [SCHEME, iterations, toBase64Url(salt), toBase64Url(await derive(password, salt, iterations))].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split('$')
  if (scheme !== SCHEME || !salt || !hash) return false
  return sameBytes(await derive(password, fromBase64Url(salt), Number(iterations)), fromBase64Url(hash))
}

/** Token al azar para la cookie de sesión o un enlace de correo */
export const newToken = (): string => toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)))

/** Hash de un token, que es lo que se guarda en la base de datos */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return toBase64Url(new Uint8Array(digest))
}
