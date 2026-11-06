import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { SellScreen } from '../sell/SellScreen'
import { IconTabs, type IconTab } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { TradeScreen } from '../trade/TradeScreen'
import { UpgradeShop } from './UpgradeShop'

type ShopTab = 'shop' | 'trade' | 'sell'

const TABS: IconTab<ShopTab>[] = [
  { id: 'shop', icon: ICON.Shop, label: 'Tienda' },
  { id: 'trade', icon: ICON.Trade, label: 'Intercambios' },
  { id: 'sell', icon: ICON.Sell, label: 'Venta' },
]

/** Pestaña Tienda: comprar mejoras, intercambiar con otros jugadores y vender al servidor */
export function ShopScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<ShopTab>('shop')

  return (
    <div className="screen tabbed">
      <IconTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="tabbed-body">
        {tab === 'shop' && <UpgradeShop game={game} />}
        {tab === 'trade' && <TradeScreen game={game} />}
        {tab === 'sell' && <SellScreen game={game} />}
      </div>
    </div>
  )
}
