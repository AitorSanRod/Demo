import { useState, type FormEvent } from 'react'
import { AccountStatus, forgotPassword, MIN_PASSWORD, signIn, signOut, signUp, useAccount, type AccountUser } from '../../net/account'
import { beforeSignOut, saveNow, useCloud } from '../../net/cloudSync'
import { AccountModal } from './AccountModal'

const Mode = { Login: 'login', Signup: 'signup', Forgot: 'forgot' } as const
type Mode = (typeof Mode)[keyof typeof Mode]

const TITLE: Record<Mode, string> = { login: 'Entrar en tu cuenta', signup: 'Crear cuenta', forgot: 'Recuperar contraseña' }
const SUBMIT: Record<Mode, string> = { login: 'Entrar', signup: 'Crear cuenta', forgot: 'Mandar correo' }

/** Cuenta opcional: entrar, crearla o recuperar la contraseña; con la sesión iniciada, su estado y salir */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  const { status, user } = useAccount()
  return status === AccountStatus.SignedIn ? <SignedIn user={user!} onClose={onClose} /> : <GuestForms onClose={onClose} />
}

function GuestForms({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>(Mode.Login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const switchTo = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (mode === Mode.Signup && password.length < MIN_PASSWORD) return setError(`La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`)
    setSending(true)
    const failed = mode === Mode.Login ? await signIn(email, password) : mode === Mode.Signup ? await signUp(email, password) : await forgotPassword(email)
    setSending(false)
    if (failed) setError(failed)
    else onClose()
  }

  return (
    <AccountModal title={TITLE[mode]} onClose={onClose}>
      {mode === Mode.Login && <p className="small confirm-text">Opcional: con cuenta, tu partida se guarda en la nube y la sigues en cualquier dispositivo.</p>}
      <form className="account-form" onSubmit={submit}>
        <input className="text-input" type="email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== Mode.Forgot && (
          <input
            className="text-input"
            type="password"
            autoComplete={mode === Mode.Signup ? 'new-password' : 'current-password'}
            placeholder="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {error && <p className="small account-error">{error}</p>}
        <button className="btn primary wide" type="submit" disabled={sending}>
          {sending ? 'Un momento…' : SUBMIT[mode]}
        </button>
      </form>
      <div className="account-links">
        {mode !== Mode.Login && <LinkButton label="Ya tengo cuenta" onClick={() => switchTo(Mode.Login)} />}
        {mode !== Mode.Signup && <LinkButton label="Crear una cuenta" onClick={() => switchTo(Mode.Signup)} />}
        {mode === Mode.Login && <LinkButton label="He olvidado la contraseña" onClick={() => switchTo(Mode.Forgot)} />}
      </div>
    </AccountModal>
  )
}

const LinkButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button className="account-link" type="button" onClick={onClick}>
    {label}
  </button>
)

const clock = (ms: number) => new Date(ms).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

function SignedIn({ user, onClose }: { user: AccountUser; onClose: () => void }) {
  const { syncedAt, failing } = useCloud()
  const [leaving, setLeaving] = useState(false)

  const leave = async () => {
    setLeaving(true)
    await beforeSignOut()
    await signOut()
    onClose()
  }

  return (
    <AccountModal title="Tu cuenta" onClose={onClose}>
      <p className="small confirm-text">
        Has entrado como <strong>{user.email}</strong>.
      </p>
      <p className="tiny muted">
        {failing ? 'Sin conexión con el servidor: se guardará en cuanto vuelva.' : syncedAt ? `Partida guardada en la nube a las ${clock(syncedAt)}.` : 'Guardando la partida en la nube…'}
      </p>
      <div className="account-form">
        <button className="btn wide" onClick={() => void saveNow()}>
          Guardar ahora
        </button>
        <button className="btn ghost wide" disabled={leaving} onClick={() => void leave()}>
          {leaving ? 'Saliendo…' : 'Cerrar sesión'}
        </button>
      </div>
      <p className="tiny muted">Al cerrar sesión la partida se queda en este dispositivo, sin cuenta.</p>
    </AccountModal>
  )
}
