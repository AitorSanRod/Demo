import type { ReactNode } from 'react'
import { RANCH_TYPES } from '../../data/ranchTypes'
import { STONES } from '../../data/stones'
import type { GameState } from '../../game/core/state'
import { bagContents, isBagEmpty } from '../../game/team/bag'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RanchTypeGems } from '../shop/RanchTypeShop'
import './bag.css'

/** Mochila (menú del rancho): lo comprado en la Tienda y aún sin usar, con dónde se usa cada cosa */
export function BagSheet({ game, onBack }: { game: GameState; onBack: () => void }) {
  const bag = bagContents(game)
  return (
    <>
      <MenuSheetHeader icon={ICON.Bag} title="Mochila" onBack={onBack} />
      {isBagEmpty(bag) ? (
        <p className="notice small">La mochila está vacía. Lo que compres en la Tienda y aún no hayas usado aparecerá aquí.</p>
      ) : (
        <>
          {bag.stones.length > 0 && (
            <BagGroup title="Piedras evolutivas" hint="Se usan en la ficha del Pokémon, en Evolución.">
              {bag.stones.map(({ id, count }) => (
                <BagTile key={id} icon={<ItemIcon item={STONES[id].item} size={44} />} name={STONES[id].name} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.ranchTypes.length > 0 && (
            <BagGroup title="Tipos de rancho" hint="Se colocan desde el botón de arriba a la izquierda del rancho.">
              {bag.ranchTypes.map(({ id, count }) => (
                <BagTile key={id} icon={<RanchTypeGems types={RANCH_TYPES[id].favors} />} name={`Rancho ${RANCH_TYPES[id].name}`} count={count} />
              ))}
            </BagGroup>
          )}
        </>
      )}
    </>
  )
}

function BagGroup({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="bag-group">
      <h3 className="bag-group-title">{title}</h3>
      <p className="tiny muted">{hint}</p>
      <div className="bag-grid">{children}</div>
    </section>
  )
}

function BagTile({ icon, name, count }: { icon: ReactNode; name: string; count: number }) {
  return (
    <div className="bag-tile">
      <span className="bag-tile-icon">
        {icon}
        <span className="bag-tile-count">×{count}</span>
      </span>
      <span className="tiny">{name}</span>
    </div>
  )
}
