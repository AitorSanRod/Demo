import { useState } from 'react'
import { resetGame } from '../../game/core/store'
import { DEFAULT_NICKNAME } from '../../game/raid/online/protocol'
import { AccountStatus, useAccount } from '../../net/account'
import { useNickname } from '../../net/identity'
import { AccountDialog } from '../account/AccountDialog'
import { NicknameDialog } from '../raid/NicknameDialog'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { disableNotifications, enableNotifications, notifyStatus, type NotifyStatus } from './notifications'
import './settings.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

const NOTIFY_LABEL: Record<NotifyStatus, string> = {
  on: 'Activados',
  off: 'Desactivados',
  denied: 'Bloqueados en el navegador',
  unsupported: 'No disponibles aquí',
}

/** Botón de engranaje con el menú de ajustes; tocar fuera del menú lo cierra */
export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [notify, setNotify] = useState(notifyStatus)
  const [naming, setNaming] = useState(false)
  const nickname = useNickname()
  const account = useAccount()
  const [accountOpen, setAccountOpen] = useState(false)

  const toggleNotify = async () => setNotify(notify === 'on' ? disableNotifications() : await enableNotifications())

  const askNickname = () => {
    setOpen(false)
    setNaming(true)
  }

  const openAccount = () => {
    setOpen(false)
    setAccountOpen(true)
  }

  const askReset = () => {
    setOpen(false)
    setConfirmingReset(true)
  }

  return (
    <>
      <button className="settings-button" onClick={() => setOpen((o) => !o)} aria-label="Ajustes" aria-expanded={open}>
        <ItemIcon item={ICON.Settings} size={30} />
      </button>
      {open && (
        <div className="settings-backdrop" onClick={() => setOpen(false)}>
          <div className="card settings-menu" role="menu" onClick={(e) => e.stopPropagation()}>
            <div className="label">Ajustes</div>
            <button
              className="settings-item"
              role="menuitemcheckbox"
              aria-checked={notify === 'on'}
              disabled={notify === 'denied' || notify === 'unsupported'}
              onClick={toggleNotify}
            >
              <ItemIcon item={ICON.Notify} size={22} off={notify !== 'on'} /> Avisar al volver de expedición
              <span className="tiny muted settings-hint">{NOTIFY_LABEL[notify]}</span>
            </button>
            <button className="settings-item" role="menuitem" onClick={openAccount}>
              <ItemIcon item={ICON.Account} size={22} /> Cuenta
              <span className="tiny muted settings-hint">{account.status === AccountStatus.SignedIn ? account.user!.email : 'Sin cuenta'}</span>
            </button>
            <button className="settings-item" role="menuitem" onClick={askNickname}>
              <ItemIcon item={ICON.Raid} size={22} /> Apodo en las raids
              <span className="tiny muted settings-hint">{nickname ?? DEFAULT_NICKNAME}</span>
            </button>
            <button className="settings-item danger" role="menuitem" onClick={askReset}>
              ↺ Reiniciar partida
            </button>
          </div>
        </div>
      )}
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
      {naming && <NicknameDialog onDone={() => setNaming(false)} onCancel={() => setNaming(false)} />}
      {confirmingReset && (
        <ConfirmDialog
          title="¿Reiniciar la partida?"
          confirmLabel="Reiniciar"
          onConfirm={resetGame}
          onCancel={() => setConfirmingReset(false)}
        >
          <p className="small confirm-text">Se borrará todo tu progreso y empezarás de cero. No se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </>
  )
}
