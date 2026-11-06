import { useState } from 'react'
import { species } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import { piecesOf } from '../../game/collection/pieces'
import type { GameState } from '../../game/core/state'
import { givableMons, giveMonBlocker } from '../../game/trade/tradeGive'
import { GoodKind, MAX_TRADE_COUNT, type OfferRequest } from '../../game/trade/tradeGoods'
import { Sprite } from '../shared/common'
import { HeartIcon } from '../shared/HeartIcon'
import { MonPicker } from '../shared/MonPicker'
import { CountInput } from './CountInput'

type OfferKind = OfferRequest['kind']

const KIND_LABEL: Record<OfferKind, string> = { [GoodKind.Mon]: 'Pokémon', [GoodKind.Pieces]: 'Tickets', [GoodKind.Shards]: 'Trozos' }

/** Qué se pone a la venta: un Pokémon del rancho o la Caja, tickets de una especie o trozos de MissingNo */
export function OfferPicker({ game, value, onChange }: { game: GameState; value: OfferRequest | null; onChange: (offer: OfferRequest | null) => void }) {
  const [kind, setKind] = useState<OfferKind>(value?.kind ?? GoodKind.Mon)
  const pick = (next: OfferKind) => {
    setKind(next)
    onChange(next === GoodKind.Shards && game.missingnoShards > 0 ? { kind: next, count: 1 } : null)
  }
  const withPieces = Object.keys(game.pieces).map(Number).filter((id) => piecesOf(game, id) > 0)

  return (
    <>
      <div className="segmented">
        {(Object.keys(KIND_LABEL) as OfferKind[]).map((k) => (
          <button key={k} className={kind === k ? 'active' : ''} onClick={() => pick(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {kind === GoodKind.Mon && (
        <MonPicker
          mons={givableMons(game)}
          selectedUid={value?.kind === GoodKind.Mon ? value.uid : undefined}
          onSelect={(uid) => onChange({ kind: GoodKind.Mon, uid })}
          lockOf={(m) => (isFavorite(game, m.speciesId) ? 'favorite' : giveMonBlocker(game, m.uid) ? 'other' : null)}
        />
      )}
      {kind === GoodKind.Mon && givableMons(game).length === 0 && <p className="small muted">No tienes Pokémon en el rancho o la Caja aparte de tu compañero.</p>}
      {kind === GoodKind.Pieces && (
        <div className="trade-species-grid">
          {withPieces.map((id) => (
            <button
              key={id}
              className={`trade-species ${value?.kind === GoodKind.Pieces && value.speciesId === id ? 'selected' : ''}`}
              disabled={isFavorite(game, id)}
              onClick={() => onChange({ kind: GoodKind.Pieces, speciesId: id, count: 1 })}
              aria-label={species(id).name}
            >
              {isFavorite(game, id) && <HeartIcon className="mon-pick-heart" />}
              <Sprite id={id} size={44} animated={false} />
              <span className="tiny">×{piecesOf(game, id)}</span>
            </button>
          ))}
          {withPieces.length === 0 && <p className="small muted">No tienes tickets de ningún Pokémon.</p>}
        </div>
      )}
      {value?.kind === GoodKind.Pieces && (
        <CountInput label="Tickets" value={value.count} max={Math.min(piecesOf(game, value.speciesId), MAX_TRADE_COUNT)} onChange={(count) => onChange({ ...value, count })} />
      )}
      {kind === GoodKind.Shards &&
        (value?.kind === GoodKind.Shards ? (
          <CountInput label="Trozos" value={value.count} max={Math.min(game.missingnoShards, MAX_TRADE_COUNT)} onChange={(count) => onChange({ ...value, count })} />
        ) : (
          <p className="small muted">No tienes trozos de MissingNo.</p>
        ))}
    </>
  )
}
