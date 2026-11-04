import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import '../shared/overlays.css'
import './account.css'

/** Ventana de las pantallas de cuenta: como ConfirmDialog, pero con los botones que ponga cada una; tocar fuera la cierra */
export function AccountModal({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card confirm-dialog account-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Un aviso con un solo botón */
export function NoticeDialog({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <AccountModal title="Cuenta" onClose={onClose}>
      <p className="small confirm-text">{text}</p>
      <button className="btn primary wide" onClick={onClose}>
        Vale
      </button>
    </AccountModal>
  )
}
