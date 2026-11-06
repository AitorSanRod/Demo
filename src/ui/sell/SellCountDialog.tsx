import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { CountInput } from '../trade/CountInput'

/** Una venta por cantidad (tickets de una especie o trozos) */
export interface CountSale {
  /** Qué se vende, en minúscula y plural: «tickets de Pikachu» */
  name: string
  /** ₽ por cada uno */
  price: number
  max: number
  /** Vende `count` en la partida y devuelve los ₽ cobrados */
  sell: (s: GameState, count: number) => number
}

/** Elegir cuántos se venden y confirmar, con el total */
export function SellCountDialog({ sale, onClose }: { sale: CountSale; onClose: () => void }) {
  const [count, setCount] = useState(1)

  return (
    <ConfirmDialog
      title={`Vender ${sale.name}`}
      confirmLabel={`Vender por ₽ ${(count * sale.price).toLocaleString('es-ES')}`}
      onConfirm={() => (act((s) => sale.sell(s, count)), onClose())}
      onCancel={onClose}
    >
      <CountInput label="Cuántos" value={count} max={sale.max} onChange={setCount} />
    </ConfirmDialog>
  )
}
