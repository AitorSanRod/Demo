import type { ReactNode } from 'react'

/** Ventana de confirmación sobre fondo oscuro; tocar fuera equivale a cancelar */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="card confirm-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn primary grow" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
