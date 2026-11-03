import { useState } from 'react'
import { RARITY_INFO, rarityOf, SPECIES, type Rarity } from '../../data/species'
import { isSeen, knownName } from '../../game/collection/dex'
import { PIECES_PER_COMBINE, piecesOf } from '../../game/collection/pieces'
import { buyPiece, maxPiecesToBuy, PIECE_SHARD_PRICE, pieceShardPrice } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Sprite } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ShardBalance } from './ShardBalance'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Tienda de MissingNo: cambia trozos por tickets del Pokémon que elijas, uno o varios a la vez */
export function MissingnoShop({ game }: { game: GameState }) {
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [count, setCount] = useState(1)
  const term = query.trim().toLowerCase()
  // Por nombre solo se encuentran las especies vistas: el buscador no debe revelar las demás
  const matches = SPECIES.filter(
    (sp) => (isSeen(game, sp.id) && sp.name.toLowerCase().includes(term)) || !term || String(sp.id) === term,
  )

  const open = (id: number) => {
    setCount(1)
    setPendingId(id)
  }
  const confirmBuy = () => {
    const id = pendingId!
    if (act((s) => buyPiece(s, id, count))) setMessage(`+${count} ${count === 1 ? 'ticket' : 'tickets'} de ${knownName(game, id)}`)
    setPendingId(null)
  }

  return (
    <>
      <ShardBalance game={game} />
      <div className="card">
        <div className="label">Precio por ticket</div>
        <div className="row gap small">
          {(Object.keys(PIECE_SHARD_PRICE) as Rarity[]).map((r) => (
            <span key={r} style={{ color: RARITY_INFO[r].color }}>
              ● {RARITY_INFO[r].name} <ItemIcon item={ICON.Shard} size={14} /> {PIECE_SHARD_PRICE[r]}
            </span>
          ))}
        </div>
      </div>
      <input
        className="search"
        type="search"
        placeholder="Buscar Pokémon por nombre o número"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {message && <p className="highlight small">{message}</p>}
      <div className="dex-grid">
        {matches.map((sp) => {
          const price = pieceShardPrice(sp.id)
          return (
            <button
              key={sp.id}
              className="dex-cell caught shop-cell"
              style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color }}
              disabled={game.missingnoShards < price}
              onClick={() => open(sp.id)}
            >
              <Sprite id={sp.id} size={56} animated={false} silhouette={!isSeen(game, sp.id)} />
              <span className="tiny">{knownName(game, sp.id)}</span>
              <span className="tiny muted">
                <ItemIcon item={ICON.Piece} size={14} /> {piecesOf(game, sp.id)}/{PIECES_PER_COMBINE}
              </span>
              <strong className="tiny with-icon"><ItemIcon item={ICON.Shard} size={14} /> {price}</strong>
            </button>
          )
        })}
      </div>
      {pendingId !== null && (
        <ConfirmDialog title="¿Canjear trozos?" confirmLabel="Canjear" onConfirm={confirmBuy} onCancel={() => setPendingId(null)}>
          <div className="row gap">
            <Sprite id={pendingId} size={64} animated={false} silhouette={!isSeen(game, pendingId)} />
            <p className="small confirm-text">
              Vas a gastar <strong className="with-icon"><ItemIcon item={ICON.Shard} size={16} /> {count * pieceShardPrice(pendingId)}</strong> trozos de MissingNo en{' '}
              {count} {count === 1 ? 'ticket' : 'tickets'} de <strong>{knownName(game, pendingId)}</strong>. Te quedarán{' '}
              {game.missingnoShards - count * pieceShardPrice(pendingId)}.
            </p>
          </div>
          <QuantityStepper value={count} max={maxPiecesToBuy(game, pendingId)} onChange={setCount} />
        </ConfirmDialog>
      )}
    </>
  )
}

/** − / + y «Máx.» para elegir cuántos tickets canjear, entre 1 y los que se pueden pagar */
function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  const set = (n: number) => onChange(Math.min(max, Math.max(1, n)))
  return (
    <div className="qty-stepper">
      <button className="btn round-btn" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Uno menos">
        −
      </button>
      <strong className="with-icon">
        <ItemIcon item={ICON.Piece} size={24} /> ×{value}
      </strong>
      <button className="btn round-btn" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Uno más">
        +
      </button>
      <button className="btn small" onClick={() => set(max)} disabled={value >= max}>
        Máx. ×{max}
      </button>
    </div>
  )
}
