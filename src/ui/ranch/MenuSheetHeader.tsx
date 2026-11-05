import type { Item } from '../../data/items'
import { ItemIcon } from '../shared/ItemIcon'

/** Cabecera de un panel del menú del rancho: icono, título y el enlace para volver al menú */
export function MenuSheetHeader({ icon, title, onBack }: { icon: Item; title: string; onBack: () => void }) {
  return (
    <div className="row between">
      <h2 className="with-icon">
        <ItemIcon item={icon} size={32} /> {title}
      </h2>
      <button className="account-link" onClick={onBack}>
        Menú
      </button>
    </div>
  )
}
