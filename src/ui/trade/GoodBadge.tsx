import type { Item } from '../../data/items'
import { askText, goodText } from '../../game/trade/goodText'
import { GoodKind, goodSpecies, type TradeAsk, type TradeGood } from '../../game/trade/tradeGoods'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

const COUNT_ICON: Record<typeof GoodKind.Shards | typeof GoodKind.Money | typeof GoodKind.Tickets, Item> = {
  [GoodKind.Shards]: ICON.Shard,
  [GoodKind.Money]: ICON.Money,
  [GoodKind.Tickets]: ICON.Ticket,
}

function GoodIcon({ good }: { good: TradeGood }) {
  const speciesId = goodSpecies(good)
  if (speciesId === null) return <ItemIcon item={COUNT_ICON[good.kind as keyof typeof COUNT_ICON]} size={56} />
  return (
    <span className="trade-good-sprite">
      <Sprite id={speciesId} size={80} animated={false} />
      {good.kind === GoodKind.Pieces && <ItemIcon item={ICON.Piece} size={22} className="trade-good-piece" />}
    </span>
  )
}

/** Lo que cambia de manos: su dibujo y su nombre */
export function GoodBadge({ good }: { good: TradeGood }) {
  return (
    <div className="trade-good">
      <GoodIcon good={good} />
      <span className="small trade-good-text">{goodText(good)}</span>
    </div>
  )
}

/** Lo que pide un anuncio: las especies (se entrega una de ellas) o la cantidad */
export function AskBadge({ ask }: { ask: TradeAsk }) {
  if (ask.kind !== GoodKind.Mon) return <GoodBadge good={ask} />
  return (
    <div className="trade-good">
      <span className="trade-good-sprites">
        {ask.speciesIds.map((id) => (
          <Sprite key={id} id={id} size={ask.speciesIds.length > 1 ? 52 : 80} animated={false} />
        ))}
      </span>
      <span className="small trade-good-text">{askText(ask)}</span>
    </div>
  )
}
