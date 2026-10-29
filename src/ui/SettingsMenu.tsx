import { useState } from 'react'
import { resetGame } from '../game/store'
import { ConfirmDialog } from './ConfirmDialog'
import { disableNotifications, enableNotifications, notifyStatus, type NotifyStatus } from './notifications'

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

  const toggleNotify = async () => setNotify(notify === 'on' ? disableNotifications() : await enableNotifications())

  const askReset = () => {
    setOpen(false)
    setConfirmingReset(true)
  }

  return (
    <>
      <button className="settings-button" onClick={() => setOpen((o) => !o)} aria-label="Ajustes" aria-expanded={open}>
        ⚙️
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
              {notify === 'on' ? '🔔' : '🔕'} Avisar al volver de expedición
              <span className="tiny muted settings-hint">{NOTIFY_LABEL[notify]}</span>
            </button>
            <button className="settings-item danger" role="menuitem" onClick={askReset}>
              ↺ Reiniciar partida
            </button>
          </div>
        </div>
      )}
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
