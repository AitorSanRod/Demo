import { useState } from 'react'
import { rarityOf, SPECIES } from '../../data/species'
import { isSeen } from '../../game/collection/dex'
import { PIECE_SHARD_PRICE } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { DexCell } from '../dex/DexCell'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RarityFoldout } from './RarityFoldout'
import { RARITIES } from './rarityTitles'
import { ShardBalance } from './ShardBalance'

/**
 * Tienda de MissingNo: los Pokémon en casillas como las de la Pokédex, agrupados por rareza. Al tocar uno se abre su
 * ficha, donde se crean sus tickets con trozos.
 */
export function MissingnoShop({ game, onOpen }: { game: GameState; onOpen: (speciesId: number) => void }) {
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  // Por nombre solo se encuentran las especies vistas: el buscador no debe revelar las demás
  const matches = SPECIES.filter(
    (sp) => !term || (isSeen(game, sp.id) && sp.name.toLowerCase().includes(term)) || String(sp.id) === term,
  )

  return (
    <>
      <ShardBalance game={game} />
      <p className="small muted">Toca un Pokémon para crear sus tickets con trozos de MissingNo.</p>
      <input
        className="search"
        type="search"
        placeholder="Buscar Pokémon por nombre o número"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length === 0 && <p className="card small muted">Ningún Pokémon visto coincide con «{query}».</p>}
      {RARITIES.map((rarity, i) => {
        const shown = matches.filter((sp) => rarityOf(sp) === rarity)
        const price = PIECE_SHARD_PRICE[rarity]
        if (shown.length === 0) return null
        return (
          <RarityFoldout
            key={rarity}
            kicker="MissingNo"
            rarity={rarity}
            art={ICON.Shard}
            aside={
              <span className="with-icon">
                <ItemIcon item={ICON.Shard} size={16} /> {price} por ticket
              </span>
            }
            defaultOpen={i === 0}
            forceOpen={term !== ''}
          >
            <div className="dex-grid missingno-grid">
              {shown.map((sp) => (
                <DexCell
                  key={sp.id}
                  game={game}
                  sp={sp}
                  selected={false}
                  tutorialTarget={false}
                  disabled={game.missingnoShards < price}
                  onSelect={() => onOpen(sp.id)}
                  footer={
                    <strong className="tiny with-icon">
                      <ItemIcon item={ICON.Shard} size={14} /> {price}
                    </strong>
                  }
                />
              ))}
            </div>
          </RarityFoldout>
        )
      })}
    </>
  )
}
