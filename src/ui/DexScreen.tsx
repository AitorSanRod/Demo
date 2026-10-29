import { useState } from 'react'
import { RARITY_INFO, rarityOf, SPECIES } from '../data/species'
import { isFavorite } from '../game/dex'
import { canCombine, combinableCount, PIECES_PER_COMBINE, piecesOf } from '../game/pieces'
import type { GameState } from '../game/state'
import { Sprite } from './common'
import { DexPanel } from './DexPanel'

export function DexScreen({ game }: { game: GameState }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const ready = combinableCount(game)

  return (
    <div className="screen scroll">
      <div className="row between">
        <h2 className="section-title">Pokédex</h2>
        <span className="small">
          Capturados <strong>{game.caught.length}</strong>/{SPECIES.length} · Vistos {game.seen.length}
        </span>
      </div>
      {ready > 0 && (
        <p className="notice small">
          🧩 {ready} {ready === 1 ? 'Pokémon listo' : 'Pokémon listos'} para combinar. Tócalos para usar sus piezas.
        </p>
      )}
      <div className="dex-grid">
        {SPECIES.map((sp) => {
          const caught = game.caught.includes(sp.id)
          const seen = caught || game.seen.includes(sp.id)
          const pieces = piecesOf(game, sp.id)
          return (
            <button
              key={sp.id}
              className={`dex-cell ${caught ? 'caught' : ''} ${canCombine(game, sp.id) ? 'ready' : ''} ${selectedId === sp.id ? 'selected' : ''}`}
              style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color }}
              disabled={!seen}
              onClick={() => setSelectedId(sp.id)}
            >
              <span className="tiny muted">#{String(sp.id).padStart(3, '0')}</span>
              {isFavorite(game, sp.id) && <span className="dex-favorite">❤️</span>}
              {seen ? (
                <Sprite id={sp.id} size={72} animated={false} silhouette={!caught} />
              ) : (
                <span className="dex-unknown">?</span>
              )}
              <span className="tiny">{seen ? sp.name : '???'}</span>
              {pieces > 0 && (
                <span className="dex-pieces tiny">
                  🧩 {pieces}/{PIECES_PER_COMBINE}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selectedId !== null && (
        <DexPanel key={selectedId} game={game} speciesId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
