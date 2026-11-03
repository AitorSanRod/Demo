import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './overlays.css'

/**
 * Ventana de confirmación sobre fondo oscuro; tocar fuera equivale a cancelar. Se pinta en <body> para que no herede
 * nada de donde se use (p. ej. el panel de la ruta tiene pointer-events: none y la dejaría sin poder tocarse).
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  /** Texto del botón de no hacer nada; cambiarlo cuando la propia acción sea «cancelar» algo */
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="card confirm-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn primary grow" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
