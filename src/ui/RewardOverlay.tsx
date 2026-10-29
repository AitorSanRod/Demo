import { useEffect, useState, type ReactNode } from 'react'

export interface RewardItem {
  key: string
  icon: ReactNode
  title: string
  detail?: string
  /** Color del fondo de la tarjeta (p. ej. el de la rareza) */
  color?: string
}

/** Tiempo que se muestra cada premio antes de pasar al siguiente */
const STEP_MS = 1400

/** Fondo oscuro con los premios de uno en uno; tocar pasa al siguiente y al final se ven todos juntos */
export function RewardOverlay({
  title,
  items,
  actionLabel = 'Continuar',
  fadeIn = true,
  onClose,
}: {
  title: string
  items: RewardItem[]
  actionLabel?: string
  /** false si el fondo ya se oscureció antes (p. ej. en la apertura del gacha), para que no destelle */
  fadeIn?: boolean
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const showingAll = index >= items.length
  const next = () => setIndex((i) => Math.min(items.length, i + 1))

  useEffect(() => {
    if (showingAll) return
    const t = setTimeout(() => setIndex(index + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [index, showingAll])

  return (
    <div className={`reward-overlay ${fadeIn ? '' : 'no-fade'}`} onClick={showingAll ? undefined : next}>
      <h2 className="reward-title">{title}</h2>
      {showingAll ? (
        <>
          <div className="reward-grid">
            {items.map((item) => (
              <RewardCard key={item.key} item={item} small />
            ))}
          </div>
          <button className="btn primary wide" onClick={onClose}>
            {actionLabel}
          </button>
        </>
      ) : (
        <>
          <RewardCard key={items[index].key} item={items[index]} />
          <span className="reward-hint small">
            {index + 1}/{items.length} · Toca para seguir
          </span>
          <button className="btn ghost small" onClick={() => setIndex(items.length)}>
            Ver todo
          </button>
        </>
      )}
    </div>
  )
}

function RewardCard({ item, small = false }: { item: RewardItem; small?: boolean }) {
  return (
    <div
      className={`reward-card ${small ? 'small' : ''}`}
      style={item.color ? { ['--reward' as string]: item.color } : undefined}
    >
      <span className="reward-icon">{item.icon}</span>
      <strong>{item.title}</strong>
      {item.detail && <span className="tiny">{item.detail}</span>}
    </div>
  )
}
