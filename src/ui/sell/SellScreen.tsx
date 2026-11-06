import { useState } from 'react'
import { species } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import { piecesOf } from '../../game/collection/pieces'
import type { GameState, OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { monSalePrice, pieceSalePrice, sellMon, sellPieces, sellShards, SHARD_SALE_PRICE } from '../../game/trade/serverSale'
import { givableMons, giveMonBlocker } from '../../game/trade/tradeGive'
import { Sprite } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { HeartIcon } from '../shared/HeartIcon'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { ShopSection, ShopTile } from '../shop/ShopTile'
import { SellCountDialog, type CountSale } from './SellCountDialog'
import './sell.css'

/** Tienda › Venta: vender al servidor Pokémon, tickets y trozos de MissingNo a precio fijo */
export function SellScreen({ game }: { game: GameState }) {
  const [selling, setSelling] = useState<OwnedMon | null>(null)
  const [countSale, setCountSale] = useState<CountSale | null>(null)
  const withPieces = Object.keys(game.pieces).map(Number).filter((id) => piecesOf(game, id) > 0)
  const mons = givableMons(game)

  return (
    <div className="screen scroll">
      <ShopSection title="Pokémon" art={ICON.Sell} tone="shop-fold-sell" defaultOpen hint="El precio depende de la rareza. Tu compañero no se puede vender.">
        {mons.map((m) => (
          <ShopTile
            key={m.uid}
            icon={<MonIcon speciesId={m.speciesId} favorite={isFavorite(game, m.speciesId)} />}
            name={`${species(m.speciesId).name} Nv. ${m.level}`}
            action={
              <button className="btn primary small" disabled={giveMonBlocker(game, m.uid) !== null} onClick={() => setSelling(m)}>
                ₽ {monSalePrice(m.speciesId)}
              </button>
            }
          >
            {isFavorite(game, m.speciesId) && <span className="tiny muted">Favorito</span>}
          </ShopTile>
        ))}
        {mons.length === 0 && <p className="small muted">No tienes Pokémon que vender aparte de tu compañero.</p>}
      </ShopSection>
      <ShopSection title="Tickets" art={ICON.Piece} tone="shop-fold-sell-pieces">
        {withPieces.map((id) => (
          <ShopTile
            key={id}
            icon={<MonIcon speciesId={id} favorite={isFavorite(game, id)} />}
            name={`Tickets de ${species(id).name}`}
            action={
              <button
                className="btn primary small"
                disabled={isFavorite(game, id)}
                onClick={() => setCountSale({ name: `tickets de ${species(id).name}`, price: pieceSalePrice(id), max: piecesOf(game, id), sell: (s, n) => sellPieces(s, id, n) })}
              >
                Vender
              </button>
            }
          >
            <span className="tiny">Tienes {piecesOf(game, id)}</span>
            <span className="tiny muted">₽ {pieceSalePrice(id)} cada uno</span>
          </ShopTile>
        ))}
        {withPieces.length === 0 && <p className="small muted">No tienes tickets de ningún Pokémon.</p>}
      </ShopSection>
      <ShopSection title="Trozos de MissingNo" art={ICON.Shard} tone="shop-fold-sell-shards">
        <ShopTile
          icon={<ItemIcon item={ICON.Shard} size={48} />}
          name="Trozos de MissingNo"
          action={
            <button
              className="btn primary small"
              disabled={game.missingnoShards === 0}
              onClick={() => setCountSale({ name: 'trozos de MissingNo', price: SHARD_SALE_PRICE, max: game.missingnoShards, sell: (s, n) => sellShards(s, n) })}
            >
              Vender
            </button>
          }
        >
          <span className="tiny">Tienes {game.missingnoShards}</span>
          <span className="tiny muted">₽ {SHARD_SALE_PRICE} cada uno</span>
        </ShopTile>
      </ShopSection>
      {selling && (
        <ConfirmDialog
          title={`¿Vender a ${species(selling.speciesId).name}?`}
          confirmLabel={`Vender por ₽ ${monSalePrice(selling.speciesId)}`}
          onConfirm={() => (act((s) => sellMon(s, selling.uid)), setSelling(null))}
          onCancel={() => setSelling(null)}
        >
          <p className="small">Se irá para siempre, con su nivel y sus ★.</p>
        </ConfirmDialog>
      )}
      {countSale && <SellCountDialog sale={countSale} onClose={() => setCountSale(null)} />}
    </div>
  )
}

function MonIcon({ speciesId, favorite }: { speciesId: number; favorite: boolean }) {
  return (
    <span className="sell-mon-icon">
      <Sprite id={speciesId} size={52} animated={false} />
      {favorite && <HeartIcon className="sell-heart" />}
    </span>
  )
}
