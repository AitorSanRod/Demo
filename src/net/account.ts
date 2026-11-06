import { useSyncExternalStore } from 'react'
import { AuthCode, MIN_PASSWORD, type AccountInfo } from '../game/core/accountRules'
import { setAccountId, setNickname } from './identity'

// Cuenta opcional con email y contraseña (worker/auth): guarda la partida en la nube (net/cloudSync.ts) y da el mismo
// id en las raids desde cualquier dispositivo. La sesión va en una cookie que la web no ve: solo se pregunta al
// servidor quién es. Los correos (confirmar, recuperar) traen un token tras el # de la web.

export { MIN_PASSWORD }

const AUTH_API = '/api/auth/'
/** Nombre del token tras el # en los enlaces de los correos (ver worker/auth/links.ts) */
const LINK_FRAGMENT = { Confirm: 'confirm', Reset: 'reset' } as const

export const AccountStatus = { Loading: 'loading', Guest: 'guest', SignedIn: 'signedIn' } as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export type AccountUser = AccountInfo

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
/** Token del enlace de recuperar la contraseña, hasta que se elige la nueva */
let resetToken: string | null = null

function update(patch: Partial<AccountState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

function setUser(user: AccountUser | null) {
  setAccountId(user?.id ?? null)
  if (user?.nickname) setNickname(user.nickname)
  update({ status: user ? AccountStatus.SignedIn : AccountStatus.Guest, user })
}

const ERROR_TEXT: Record<string, string> = {
  [AuthCode.Invalid]: `Revisa el email y la contraseña (al menos ${MIN_PASSWORD} caracteres).`,
  [AuthCode.Taken]: 'Ya hay una cuenta con ese email. Prueba a entrar.',
  [AuthCode.BadCredentials]: 'Email o contraseña incorrectos.',
  [AuthCode.NotConfirmed]: 'Aún no has confirmado el email: mira tu correo (también en spam). Si no está, vuelve a probar en un minuto y te lo mandamos otra vez.',
  [AuthCode.Locked]: 'Demasiados intentos fallidos. Espera un cuarto de hora y vuelve a probar.',
  [AuthCode.BadToken]: 'El enlace ha caducado o ya se usó. Pide otro.',
}
const NETWORK_ERROR = 'No se ha podido conectar con el servidor de cuentas. Prueba otra vez.'

/** Error de una petición de cuenta, ya en palabras del jugador */
class AccountError extends Error {}

async function post(action: string, body: object = {}): Promise<{ user?: AccountUser | null }> {
  let res: Response
  try {
    res = await fetch(AUTH_API + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new AccountError(NETWORK_ERROR)
  }
  const data = (await res.json().catch(() => ({}))) as { code?: string; user?: AccountUser | null }
  if (!res.ok) throw new AccountError(ERROR_TEXT[data.code ?? ''] ?? NETWORK_ERROR)
  return data
}

/** Vuelve a preguntar al servidor quién es (al abrir la app o si la sesión ha caducado) */
export async function refreshAccount() {
  try {
    const res = await fetch(AUTH_API + 'me', { cache: 'no-store' })
    setUser(res.ok ? (((await res.json()) as { user: AccountUser | null }).user ?? null) : null)
  } catch {
    // Sin conexión: si aún no se sabía, se sigue sin cuenta; si había sesión, se mantiene
    if (current.status === AccountStatus.Loading) setUser(null)
  }
}

/** El token del enlace del correo, si la web se ha abierto desde uno; se quita de la dirección */
function linkToken(): { kind: string; token: string } | null {
  const [kind, token] = window.location.hash.slice(1).split('=')
  if (!token || !Object.values<string>(LINK_FRAGMENT).includes(kind)) return null
  history.replaceState(null, '', window.location.pathname + window.location.search)
  return { kind, token }
}

/** Devuelven el error en palabras del jugador, o null si ha ido bien */
type Attempt = Promise<string | null>

async function attempt(run: () => Promise<unknown>): Attempt {
  try {
    await run()
    return null
  } catch (e) {
    return e instanceof AccountError ? e.message : NETWORK_ERROR
  }
}

let started = false

/** Al abrir la app (una vez): el enlace del correo, si se viene de uno, y la sesión que hubiera */
export async function startAccount() {
  if (started) return
  started = true
  const link = linkToken()
  if (link?.kind === LINK_FRAGMENT.Reset) {
    resetToken = link.token
    update({ recovering: true })
  }
  if (link?.kind === LINK_FRAGMENT.Confirm) {
    const failed = await attempt(async () => setUser((await post('confirm', { token: link.token })).user ?? null))
    update({ notice: failed ?? '¡Cuenta confirmada! Ya has entrado.' })
    if (!failed) return
  }
  await refreshAccount()
}

export const signIn = (email: string, password: string): Attempt => attempt(async () => setUser((await post('login', { email, password })).user ?? null))

/** Crea la cuenta; hasta confirmar el email no se puede entrar */
export const signUp = (email: string, password: string): Attempt =>
  attempt(async () => {
    await post('signup', { email, password })
    update({ notice: `Te hemos mandado un correo a ${email.trim()}. Abre el enlace para confirmar la cuenta (mira también en spam).` })
  })

export const signOut = (): Attempt => attempt(async () => (await post('logout'), setUser(null)))

export const forgotPassword = (email: string): Attempt =>
  attempt(async () => {
    await post('forgot', { email })
    update({ notice: `Si hay una cuenta con ${email.trim()}, te llegará un correo para elegir otra contraseña.` })
  })

/** La contraseña nueva tras llegar desde el correo de recuperarla; con ella se entra en la cuenta */
export const setNewPassword = (password: string): Attempt =>
  attempt(async () => {
    setUser((await post('reset', { token: resetToken, password })).user ?? null)
    resetToken = null
    update({ recovering: false, notice: 'Contraseña cambiada. Ya has entrado.' })
  })

/** Guarda el apodo en la cuenta para tenerlo en cualquier dispositivo (sin cuenta, no hace nada) */
export async function saveAccountNickname(nickname: string) {
  if (current.status !== AccountStatus.SignedIn) return
  const failed = await attempt(() => post('nickname', { nickname }))
  if (!failed && current.user) update({ user: { ...current.user, nickname } })
}

/** Aparecer o no en el ranking de dinero (quien no aparece tampoco lo ve); devuelve el error o null */
export const setRanked = (ranked: boolean): Attempt => attempt(async () => setUser((await post('ranked', { ranked })).user ?? null))

export const dismissNotice = () => update({ notice: null })

export function cancelRecovery() {
  resetToken = null
  update({ recovering: false })
}

/** La cuenta de ahora, fuera de React */
export const account = (): AccountState => current

export function subscribeAccount(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAccount = (): AccountState => useSyncExternalStore(subscribeAccount, account)
