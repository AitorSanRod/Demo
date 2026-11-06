import type { ReactNode } from 'react'

interface Props {
  /** Dibujo y nombre de lo que se recoge */
  children: ReactNode
  detail: string
  /** Por qué aún no se puede recoger (null si se puede) */
  blocker?: string | null
  collecting: boolean
  /** Hay otra recogida en marcha */
  disabled: boolean
  onCollect: () => void
}

/** Una cosa pendiente de Notificaciones: qué es, de dónde viene y su botón Recoger */
export function InboxRow({ children, detail, blocker = null, collecting, disabled, onCollect }: Props) {
  return (
    <div className="card inbox-entry">
      <div className="inbox-thing">{children}</div>
      <div className="grow">
        <span className="tiny muted">{detail}</span>
        {blocker && <span className="tiny account-error inbox-blocker">{blocker}</span>}
      </div>
      <button className="btn primary small" disabled={blocker !== null || disabled} onClick={onCollect}>
        {collecting ? 'Recogiendo…' : 'Recoger'}
      </button>
    </div>
  )
}
