import {
  AuthError,
  getUser,
  handleAuthCallback,
  login,
  logout,
  MissingIdentityError,
  onAuthChange,
  requestPasswordRecovery,
  signup,
  updateUser,
  type User,
} from '@netlify/identity'
import { useSyncExternalStore } from 'react'
import { setAccountId, setNickname } from './identity'

// Cuenta opcional con email y contraseña (Netlify Identity): guarda la partida en la nube (net/cloudSync.ts) y da el
// mismo id en las raids desde cualquier dispositivo. Netlify guarda las contraseñas y manda los correos de confirmar
// la cuenta y de recuperar la contraseña.

/** Letras como mínimo de una contraseña */
export const MIN_PASSWORD = 8

export const AccountStatus = { Loading: 'loading', Guest: 'guest', SignedIn: 'signedIn' } as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export interface AccountUser {
  id: string
  email: string
  /** Apodo de las raids guardado en la cuenta */
  nickname: string | null
}

interface AccountState {
  status: AccountStatus
  user: AccountUser | null
  /** Ha llegado desde el correo de recuperar la contraseña: hay que pedir la nueva */
  recovering: boolean
  /** Aviso para el jugador (cuenta confirmada, enlace caducado…) */
  notice: string | null
}

let current: AccountState = { status: AccountStatus.Loading, user: null, recovering: false, notice: null }
const listeners = new Set<() => void>()

function update(patch: Partial<AccountState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

const metaNickname = (u: User) => (typeof u.userMetadata?.nickname === 'string' ? u.userMetadata.nickname : null)

function setUser(u: User | null) {
  const user = u && { id: u.id, email: u.email ?? '', nickname: metaNickname(u) }
  setAccountId(user?.id ?? null)
  if (user?.nickname) setNickname(user.nickname)
  update({ status: user ? AccountStatus.SignedIn : AccountStatus.Guest, user })
}

/** Errores de Identity en palabras del jugador */
function errorText(e: unknown): string {
  if (e instanceof MissingIdentityError) return 'Las cuentas no están disponibles aquí (hacen falta Netlify y su Identity).'
  const msg = e instanceof AuthError ? e.message.toLowerCase() : ''
  if (msg.includes('not confirmed')) return 'Aún no has confirmado el email: mira tu correo (y la carpeta de spam).'
  if (msg.includes('already been registered')) return 'Ya hay una cuenta con ese email. Prueba a entrar.'
  if (msg.includes('no user found') || msg.includes('invalid password') || msg.includes('invalid_grant')) return 'Email o contraseña incorrectos.'
  if (msg.includes('expired') || msg.includes('invalid token')) return 'El enlace ha caducado o ya se usó. Pide otro.'
  return 'No se ha podido conectar con el servidor de cuentas. Prueba otra vez.'
}

let started = false

/** Al abrir la app (una vez): los enlaces de los correos (confirmar, recuperar) y la sesión que hubiera */
export async function startAccount() {
  if (started) return
  started = true
  try {
    const callback = await handleAuthCallback()
    if (callback?.type === 'confirmation') update({ notice: '¡Cuenta confirmada! Ya has entrado.' })
    if (callback?.type === 'recovery') update({ recovering: true })
    setUser(callback?.user ?? (await getUser()))
  } catch (e) {
    update({ notice: errorText(e) })
    setUser(await getUser().catch(() => null))
  }
  onAuthChange((_event, user) => setUser(user))
}

/** Devuelven el error en palabras del jugador, o null si ha ido bien */
type Attempt = Promise<string | null>

const attempt = async (run: () => Promise<unknown>): Attempt => {
  try {
    await run()
    return null
  } catch (e) {
    return errorText(e)
  }
}

export const signIn = (email: string, password: string): Attempt => attempt(async () => setUser(await login(email.trim(), password)))

/** Crea la cuenta; hasta confirmar el email no se puede entrar */
export const signUp = (email: string, password: string): Attempt =>
  attempt(async () => {
    const user = await signup(email.trim(), password)
    if (user.confirmedAt) setUser(user)
    else update({ notice: `Te hemos mandado un correo a ${email.trim()}. Abre el enlace para confirmar la cuenta.` })
  })

export const signOut = (): Attempt => attempt(async () => (await logout(), setUser(null)))

export const forgotPassword = (email: string): Attempt =>
  attempt(async () => {
    await requestPasswordRecovery(email.trim())
    update({ notice: `Si hay una cuenta con ${email.trim()}, te llegará un correo para elegir otra contraseña.` })
  })

/** La contraseña nueva tras llegar desde el correo de recuperarla (ya se ha entrado en la cuenta) */
export const setNewPassword = (password: string): Attempt =>
  attempt(async () => {
    await updateUser({ password })
    update({ recovering: false, notice: 'Contraseña cambiada.' })
  })

/** Guarda el apodo en la cuenta para tenerlo en cualquier dispositivo (sin cuenta, no hace nada) */
export async function saveAccountNickname(nickname: string) {
  if (current.status === AccountStatus.SignedIn) await attempt(() => updateUser({ data: { nickname } }))
}

export const dismissNotice = () => update({ notice: null })
export const cancelRecovery = () => update({ recovering: false })

/** La cuenta de ahora, fuera de React */
export const account = (): AccountState => current

export function subscribeAccount(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAccount = (): AccountState => useSyncExternalStore(subscribeAccount, account)
