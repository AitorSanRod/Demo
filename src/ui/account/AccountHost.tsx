import { useState, type FormEvent } from 'react'
import type { GameState } from '../../game/core/state'
import { AccountStatus, cancelRecovery, dismissNotice, MIN_PASSWORD, setNewPassword, useAccount } from '../../net/account'
import { dismissCloudNotice, useCloud } from '../../net/cloudSync'
import { AccountModal, NoticeDialog } from './AccountModal'
import { GiftPrompt } from '../gift/GiftPrompt'
import { CloudChoiceDialog } from './CloudChoiceDialog'

/**
 * Lo que la cuenta tiene que enseñar en cualquier pantalla, de uno en uno: contraseña nueva, elegir partida, avisos y,
 * al final, el obsequio diario sin recoger (solo con la partida ya al día con la nube y fuera del tutorial)
 */
export function AccountHost({ game }: { game: GameState }) {
  const account = useAccount()
  const cloud = useCloud()
  if (account.recovering) return <NewPasswordDialog />
  if (cloud.choice) return <CloudChoiceDialog cloud={cloud.choice} local={game} />
  if (account.notice) return <NoticeDialog text={account.notice} onClose={dismissNotice} />
  if (cloud.notice) return <NoticeDialog text={cloud.notice} onClose={dismissCloudNotice} />
  if (account.status === AccountStatus.SignedIn && cloud.syncedAt !== null && game.tutorial === null) return <GiftPrompt />
  return null
}

/** Tras abrir el enlace del correo de recuperar la contraseña (ya se ha entrado en la cuenta) */
function NewPasswordDialog() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return setError(`La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`)
    setError(await setNewPassword(password))
  }

  return (
    <AccountModal title="Elige otra contraseña" onClose={cancelRecovery}>
      <form className="account-form" onSubmit={submit}>
        <input className="text-input" type="password" autoComplete="new-password" placeholder="Contraseña nueva" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="small account-error">{error}</p>}
        <button className="btn primary wide" type="submit">
          Guardar contraseña
        </button>
      </form>
    </AccountModal>
  )
}
