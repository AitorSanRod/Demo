import { useState } from 'react'
import { RARITY_INFO, rarityOf, SPECIES, species, type Rarity } from '../data/species'
import { PIECES_PER_COMBINE, piecesOf } from '../game/pieces'
import { buyPiece, PIECE_SHARD_PRICE, pieceShardPrice } from '../game/shredder'
import type { GameState } from '../game/state'
import { act } from '../game/store'
import { Sprite } from './common'
import { ConfirmDialog } from './ConfirmDialog'
import { ShardBalance } from './ShardBalance'

/** Tienda de MissingNo: cambia trozos por 1 pieza del Pokémon que elijas */
export function MissingnoShop({ game }: { game: GameState }) {
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)
  const term = query.trim().toLowerCase()
  const matches = SPECIES.filter((sp) => sp.name.toLowerCase().includes(term) || String(sp.id) === term)

  const confirmBuy = () => {
    const sp = species(pendingId!)
    if (act((s) => buyPiece(s, sp.id))) setMessage(`+1 pieza de ${sp.name}`)
    setPendingId(null)
  }

  return (
    <>
      <ShardBalance game={game} />
      <div className="card">
        <div className="label">Precio por pieza</div>
        <div className="row gap small">
          {(Object.keys(PIECE_SHARD_PRICE) as Rarity[]).map((r) => (
            <span key={r} style={{ color: RARITY_INFO[r].color }}>
              ● {RARITY_INFO[r].name} 👾 {PIECE_SHARD_PRICE[r]}
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
              onClick={() => setPendingId(sp.id)}
            >
              <Sprite id={sp.id} size={56} animated={false} />
              <span className="tiny">{sp.name}</span>
              <span className="tiny muted">
                🧩 {piecesOf(game, sp.id)}/{PIECES_PER_COMBINE}
              </span>
              <strong className="tiny">👾 {price}</strong>
            </button>
          )
        })}
      </div>
      {pendingId !== null && (
        <ConfirmDialog title="¿Canjear trozos?" confirmLabel="Canjear" onConfirm={confirmBuy} onCancel={() => setPendingId(null)}>
          <div className="row gap">
            <Sprite id={pendingId} size={64} animated={false} />
            <p className="small confirm-text">
              Vas a gastar <strong>👾 {pieceShardPrice(pendingId)}</strong> trozos de MissingNo en 1 pieza de{' '}
              <strong>{species(pendingId).name}</strong>. Te quedarán {game.missingnoShards - pieceShardPrice(pendingId)}.
            </p>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}
