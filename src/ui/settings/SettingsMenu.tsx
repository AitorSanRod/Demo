import { useState } from 'react'
import { resetGame } from '../../game/core/store'
import { DEFAULT_NICKNAME } from '../../game/raid/online/protocol'
import { AccountStatus, useAccount } from '../../net/account'
import { useNickname } from '../../net/identity'
import { AccountDialog } from '../account/AccountDialog'
import { NicknameDialog } from '../raid/NicknameDialog'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { PUSH_TOPICS } from '../../game/core/push'
import { usePush } from '../../net/push'
import { NotificationsDialog } from './NotificationsDialog'
import './settings.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Botón de engranaje con el menú de ajustes; tocar fuera del menú lo cierra */
export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const push = usePush()
  const [notifying, setNotifying] = useState(false)
  const [naming, setNaming] = useState(false)
  const nickname = useNickname()
  const account = useAccount()
  const [accountOpen, setAccountOpen] = useState(false)

  const openNotifications = () => {
    setOpen(false)
    setNotifying(true)
  }
  const notifyHint = push.topics.length === 0 ? 'Desactivadas' : push.topics.length === PUSH_TOPICS.length ? 'Todas' : `${push.topics.length} de ${PUSH_TOPICS.length}`

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
            <button className="settings-item" role="menuitem" onClick={openNotifications}>
              <ItemIcon item={ICON.Notify} size={22} off={push.topics.length === 0} /> Notificaciones
              <span className="tiny muted settings-hint">{notifyHint}</span>
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
      {notifying && <NotificationsDialog onClose={() => setNotifying(false)} />}
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
