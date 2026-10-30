import { useState } from 'react'
import { RARITY_INFO, rarityOf, species, type Rarity } from '../../data/species'
import { isSeen, knownName } from '../../game/collection/dex'
import { canCombine } from '../../game/collection/pieces'
import {
  raritySelection,
  selectionShards,
  shardsPerPiece,
  SHARDS_PER_PIECE,
  shreddableStock,
  shredSelection,
  type ShredSelection,
} from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Sprite } from '../shared/common'
import { ShardBalance } from './ShardBalance'

const RATES = (Object.keys(SHARDS_PER_PIECE) as Rarity[])
  .map((r) => `${RARITY_INFO[r].name} ${SHARDS_PER_PIECE[r]}`)
  .join(' · ')

/** Lista de piezas: se marcan las que se quieren triturar y no se tritura nada hasta confirmar */
export function Shredder({ game }: { game: GameState }) {
  const [selection, setSelection] = useState<ShredSelection>({})
  const [message, setMessage] = useState('')
  const stock = shreddableStock(game)
  const protectedCount = game.favorites.filter((id) => (game.pieces[id] ?? 0) > 0).length
  const selectedPieces = Object.values(selection).reduce((a, b) => a + b, 0)
  const shards = selectionShards(selection)

  const select = (speciesId: number, count: number) => setSelection((sel) => ({ ...sel, [speciesId]: count }))
  const selectRarity = (rarity: Rarity) => setSelection((sel) => ({ ...sel, ...raritySelection(game, rarity) }))

  const confirm = () => {
    const gained = act((s) => shredSelection(s, selection))
    setSelection({})
    setMessage(`Trituradas ${selectedPieces} piezas: +👾 ${gained}`)
  }

  return (
    <>
      <ShardBalance game={game} />
      <p className="small muted">
        Marca las piezas que quieras triturar y confirma. Trozos por pieza: {RATES}. Úsalos en la pestaña MissingNo para
        comprar piezas del Pokémon que quieras.
      </p>
      {protectedCount > 0 && (
        <p className="small muted">
          ❤️ {protectedCount} {protectedCount === 1 ? 'favorito no aparece' : 'favoritos no aparecen'} aquí: sus piezas
          están protegidas. Cámbialo en la Pokédex.
        </p>
      )}
      {message && <p className="highlight small">{message}</p>}
      {stock.length === 0 && <p className="card small muted">No tienes piezas para triturar. Consíguelas en el gacha.</p>}
      {stock.length > 0 && <RarityButtons game={game} onSelect={selectRarity} />}
      {stock.map(({ speciesId, count }) => {
        const sp = species(speciesId)
        const name = knownName(game, speciesId)
        const marked = selection[speciesId] ?? 0
        return (
          <div
            key={speciesId}
            className={`card shred-row ${marked > 0 ? 'marked' : ''}`}
            style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color }}
          >
            <Sprite id={speciesId} size={48} animated={false} silhouette={!isSeen(game, speciesId)} />
            <div className="grow small">
              <strong>{name}</strong>
              <span className="muted">
                🧩 {count} · 👾 {shardsPerPiece(speciesId)} por pieza
                {canCombine(game, speciesId) && ' · se pueden combinar'}
              </span>
              {marked > 0 && <span className="shred-marked">Para triturar: {marked}</span>}
            </div>
            <button className="btn small" disabled={marked >= count} onClick={() => select(speciesId, marked + 1)}>
              Triturar 1
            </button>
            <button className="btn small" disabled={marked >= count} onClick={() => select(speciesId, count)}>
              Todas
            </button>
            {marked > 0 && (
              <button className="hud-close" onClick={() => select(speciesId, 0)} aria-label={`Desmarcar ${name}`}>
                ✕
              </button>
            )}
          </div>
        )
      })}
      {selectedPieces > 0 && (
        <div className="card shred-confirm">
          <span className="small grow">
            {selectedPieces} {selectedPieces === 1 ? 'pieza' : 'piezas'} → <strong>👾 {shards}</strong>
          </span>
          <button className="btn small" onClick={() => setSelection({})}>
            Cancelar
          </button>
          <button className="btn primary small" onClick={confirm}>
            Confirmar
          </button>
        </div>
      )}
    </>
  )
}

const RARITY_PLURAL: Record<Rarity, string> = { common: 'comunes', rare: 'raros', epic: 'épicos', legendary: 'legendarios' }

/** Marca de una vez todas las piezas (no favoritas) de una rareza; sigue haciendo falta confirmar */
function RarityButtons({ game, onSelect }: { game: GameState; onSelect: (rarity: Rarity) => void }) {
  return (
    <div className="row gap">
      {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => {
        const pieces = Object.values(raritySelection(game, r)).reduce((a, b) => a + b, 0)
        return (
          <button
            key={r}
            className="btn small rarity-all"
            style={{ ['--rarity' as string]: RARITY_INFO[r].color }}
            disabled={pieces === 0}
            onClick={() => onSelect(r)}
          >
            Todos los {RARITY_PLURAL[r]} ({pieces})
          </button>
        )
      })}
    </div>
  )
}
