import { useState } from 'react'
import { RARITY_INFO, rarityOf, species, type Rarity } from '../../data/species'
import { raritySelection, selectionShards, SHARDS_PER_PIECE, shreddableStock, shredSelection, type ShredSelection } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { HeartIcon } from '../shared/HeartIcon'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BigAction } from '../shared/sheet/MonSheet'
import { RarityFoldout } from './RarityFoldout'
import { RARITIES } from './rarityTitles'
import { ShardBalance } from './ShardBalance'
import { ShredCell } from './ShredCell'

/** Tickets de Pokémon por rareza: se marcan los que se quieren triturar y no se tritura nada hasta confirmar */
export function Shredder({ game }: { game: GameState }) {
  const [selection, setSelection] = useState<ShredSelection>({})
  const [message, setMessage] = useState('')
  const stock = shreddableStock(game)
  const protectedCount = game.favorites.filter((id) => (game.pieces[id] ?? 0) > 0).length
  const selectedPieces = Object.values(selection).reduce((a, b) => a + b, 0)
  const rarityOfStock = (speciesId: number) => rarityOf(species(speciesId))
  // Se abre el desplegable de la rareza más común que tenga tickets
  const firstRarity = RARITIES.find((r) => stock.some(({ speciesId }) => rarityOfStock(speciesId) === r))

  const select = (speciesId: number, count: number) => setSelection((sel) => ({ ...sel, [speciesId]: count }))
  const selectRarity = (rarity: Rarity) => setSelection((sel) => ({ ...sel, ...raritySelection(game, rarity) }))

  const confirm = () => {
    const gained = act((s) => shredSelection(s, selection))
    setSelection({})
    setMessage(`Triturados ${selectedPieces} tickets: +${gained} trozos de MissingNo`)
  }

  return (
    <>
      <ShardBalance game={game} />
      <p className="small muted">
        Toca un Pokémon para marcar sus tickets uno a uno y confirma abajo. Los trozos se gastan en la pestaña MissingNo.
      </p>
      {protectedCount > 0 && (
        <p className="small muted">
          <HeartIcon size={16} /> {protectedCount} {protectedCount === 1 ? 'favorito no aparece' : 'favoritos no aparecen'} aquí: sus tickets
          están protegidos. Cámbialo en la Pokédex.
        </p>
      )}
      {message && <p className="highlight small">{message}</p>}
      {stock.length === 0 && <p className="card small muted">No tienes tickets de Pokémon para triturar. Consíguelos en el gacha.</p>}
      {RARITIES.map((rarity) => {
        const rows = stock.filter(({ speciesId }) => rarityOfStock(speciesId) === rarity)
        if (rows.length === 0) return null
        const tickets = rows.reduce((sum, r) => sum + r.count, 0)
        const allMarked = rows.every(({ speciesId, count }) => (selection[speciesId] ?? 0) >= count)
        return (
          <RarityFoldout
            key={rarity}
            kicker="Trituradora"
            rarity={rarity}
            art={ICON.Shredder}
            aside={
              <span className="with-icon">
                <ItemIcon item={ICON.Shard} size={16} /> {SHARDS_PER_PIECE[rarity]} por ticket
              </span>
            }
            defaultOpen={rarity === firstRarity}
          >
            <div className="dex-grid">
              {rows.map(({ speciesId, count }) => (
                <ShredCell
                  key={speciesId}
                  game={game}
                  speciesId={speciesId}
                  count={count}
                  marked={selection[speciesId] ?? 0}
                  onMark={(n) => select(speciesId, n)}
                />
              ))}
            </div>
            <button
              className="btn shred-all"
              style={{ ['--rarity' as string]: RARITY_INFO[rarity].color }}
              disabled={allMarked}
              onClick={() => selectRarity(rarity)}
            >
              Marcar los {tickets} {tickets === 1 ? 'ticket' : 'tickets'}
            </button>
          </RarityFoldout>
        )
      })}
      {selectedPieces > 0 && (
        <div className="card shred-confirm">
          <BigAction
            icon={ICON.Shredder}
            label={`Triturar ${selectedPieces} ${selectedPieces === 1 ? 'ticket' : 'tickets'}`}
            price={selectionShards(selection)}
            priceIcon={ICON.Shard}
            className="primary"
            onClick={confirm}
          />
          <button className="btn small" onClick={() => setSelection({})}>
            Desmarcar todo
          </button>
        </div>
      )}
    </>
  )
}
