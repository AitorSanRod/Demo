import { useState } from 'react'
import { DEFAULT_NICKNAME, NICKNAME_MAX } from '../../game/raid/online/protocol'
import { saveAccountNickname } from '../../net/account'
import { nickname, setNickname } from '../../net/identity'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import './raid.css'

/** Elegir el apodo con el que te ven los demás jugadores en las salas de los jefes; con cuenta, se guarda también en ella */
export function NicknameDialog({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(nickname() ?? '')
  const save = () => {
    const name = setNickname(draft)
    void saveAccountNickname(name)
    onDone(name)
  }

  return (
    <ConfirmDialog title="Tu apodo en las raids" confirmLabel="Guardar" onConfirm={save} onCancel={onCancel}>
      <p className="small confirm-text">Es lo que verán los demás jugadores en la sala del jefe. Puedes cambiarlo en Ajustes.</p>
      <input
        className="text-input nickname-input"
        value={draft}
        maxLength={NICKNAME_MAX}
        placeholder={DEFAULT_NICKNAME}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
    </ConfirmDialog>
  )
}
