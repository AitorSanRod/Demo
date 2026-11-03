import type { Item } from '../../../data/items'
import { ItemIcon } from '../ItemIcon'
import './stepper-action.css'

interface Props {
  icon: Item
  /** Texto del botón central según la cantidad elegida (0: ninguna aún) */
  label: (count: number) => string
  /** Precio que se enseña según la cantidad (con 0, el de una) */
  price: (count: number) => number
  /** Moneda del precio; sin ella, pokécuartos (₽) */
  priceIcon?: Item
  /** Cantidad elegida sin aceptar (0: ninguna) */
  count: number
  /** Cantidad mínima: 0 deja el botón sin elegir nada; 1 hace que siempre haya al menos una elegida */
  min?: number
  /** La mayor cantidad que se puede pagar ahora (0: el botón queda desactivado) */
  max: number
  onChange: (count: number) => void
  onAccept: () => void
}

/**
 * Acción de la ficha que se puede repetir varias veces de golpe: − y + eligen cuántas y el botón ancho del centro las
 * acepta; sin ninguna elegida, el botón central elige la primera. «Máx.» aparece debajo si caben más.
 */
export function StepperAction({ icon, label, price, priceIcon, count, min = 0, max, onChange, onAccept }: Props) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)))

  return (
    <div className="stepper-action">
      <button className="btn round-btn" onClick={() => set(count - 1)} disabled={count <= min} aria-label="Uno menos">
        −
      </button>
      <button className={`btn big-action ${count > 0 ? 'primary' : ''}`} disabled={max === 0} onClick={count > 0 ? onAccept : () => set(1)}>
        <ItemIcon item={icon} size={36} off={max === 0} />
        <span className="grow">{label(count)}</span>
        <span className="big-action-price with-icon">
          {priceIcon ? <ItemIcon item={priceIcon} size={18} /> : '₽'} {price(count)}
        </span>
      </button>
      <button className="btn round-btn" onClick={() => set(count + 1)} disabled={count >= max} aria-label="Uno más">
        +
      </button>
      {count > 0 && count < max && (
        <button className="btn small stepper-max" onClick={() => set(max)}>
          Máx. ×{max}
        </button>
      )}
    </div>
  )
}
