import { useState } from 'react'
import { RARITY_INFO, rarityOf, species, type Rarity } from '../../data/species'
import { piecesOf, PIECES_PER_COMBINE } from '../../game/collection/pieces'
import { DISCOVER_SHARD_PRICE, discoverableSpecies, discoverPrice, discoverSpecies } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Sprite } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { RevealOverlay } from '../shared/RevealOverlay'
import { ShardBalance } from './ShardBalance'

/** Descubre con trozos de MissingNo una especie no vista de la que ya se tienen piezas */
export function DiscoverPanel({ game }: { game: GameState }) {
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [revealedId, setRevealedId] = useState<number | null>(null)
  const candidates = discoverableSpecies(game)

  const confirm = () => {
    const id = pendingId!
    if (act((s) => discoverSpecies(s, id))) setRevealedId(id)
    setPendingId(null)
  }

  return (
    <>
      <ShardBalance game={game} />
      <div className="card">
        <div className="label">Precio por descubrimiento</div>
        <div className="row gap small">
          {(Object.keys(DISCOVER_SHARD_PRICE) as Rarity[]).map((r) => (
            <span key={r} style={{ color: RARITY_INFO[r].color }}>
              ● {RARITY_INFO[r].name} 👾 {DISCOVER_SHARD_PRICE[r]}
            </span>
          ))}
        </div>
      </div>
      {candidates.length === 0 && (
        <p className="card small muted">No tienes piezas de Pokémon sin descubrir. Consíguelas en el gacha.</p>
      )}
      <div className="dex-grid">
        {candidates.map((id) => (
          <button
            key={id}
            className="dex-cell caught shop-cell"
            style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(species(id))].color }}
            disabled={game.missingnoShards < discoverPrice(id)}
            onClick={() => setPendingId(id)}
          >
            <Sprite id={id} size={56} animated={false} silhouette />
            <span className="tiny">???</span>
            <span className="tiny muted">
              🧩 {piecesOf(game, id)}/{PIECES_PER_COMBINE}
            </span>
            <strong className="tiny">👾 {discoverPrice(id)}</strong>
          </button>
        ))}
      </div>
      {pendingId !== null && (
        <ConfirmDialog title="¿Descubrir Pokémon?" confirmLabel="Descubrir" onConfirm={confirm} onCancel={() => setPendingId(null)}>
          <div className="row gap">
            <Sprite id={pendingId} size={64} animated={false} silhouette />
            <p className="small confirm-text">
              Vas a gastar <strong>👾 {discoverPrice(pendingId)}</strong> trozos de MissingNo en descubrir este Pokémon. Te
              quedarán {game.missingnoShards - discoverPrice(pendingId)}.
            </p>
          </div>
        </ConfirmDialog>
      )}
      {revealedId !== null && (
        <RevealOverlay
          title="¡Nuevo en la Pokédex!"
          speciesId={revealedId}
          name={species(revealedId).name}
          color={RARITY_INFO[rarityOf(species(revealedId))].color}
          onClose={() => setRevealedId(null)}
        />
      )}
    </>
  )
}
