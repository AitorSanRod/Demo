// Lo que comparten la web y el servidor de cuentas (worker/auth): qué email y contraseña valen y qué errores hay.

/** Letras como mínimo de una contraseña */
export const MIN_PASSWORD = 8
/** Letras como mucho de una contraseña (por encima, solo serviría para cargar al servidor) */
const MAX_PASSWORD = 128

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/

/** El email en minúsculas y sin espacios; null si no parece un email */
export function normalizeEmail(v: unknown): string | null {
  const email = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return EMAIL.test(email) ? email : null
}

export const isValidPassword = (v: unknown): v is string => typeof v === 'string' && v.length >= MIN_PASSWORD && v.length <= MAX_PASSWORD

/** Por qué ha fallado una petición de cuenta */
export const AuthCode = {
  Invalid: 'invalid',
  Taken: 'taken',
  BadCredentials: 'bad_credentials',
  NotConfirmed: 'not_confirmed',
  Locked: 'locked',
  BadToken: 'bad_token',
  SignedOut: 'signed_out',
  WrongOrigin: 'wrong_origin',
} as const
export type AuthCode = (typeof AuthCode)[keyof typeof AuthCode]

/** La cuenta tal y como la ve la web */
export interface AccountInfo {
  id: string
  email: string
  /** Apodo de las raids guardado en la cuenta */
  nickname: string | null
}
