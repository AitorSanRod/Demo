import { useState } from 'react'
import { RARITY_INFO, rarityOf, species, SPECIES } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import { canCombine, combinableCount, CombineKind, combineKind, PIECES_PER_COMBINE, piecesOf } from '../../game/collection/pieces'
import { TutorialStep, type GameState } from '../../game/core/state'
import { tutorialStarter } from '../../game/team/tutorial'
import { Sprite } from '../shared/common'
import { TutorialHint } from '../shared/TutorialHint'
import { PokemonSheet } from '../shared/sheet/PokemonSheet'
import { PixelQuestion } from '../shared/PixelQuestion'
import { ICON } from '../shared/icons'
import { HeartIcon } from '../shared/HeartIcon'
import { ItemIcon } from '../shared/ItemIcon'
import './dex.css'

/** Etiqueta sobre la casilla que ya se puede combinar */
const READY_TAG: Record<CombineKind, string> = {
  [CombineKind.Unlock]: '¡Crear!',
  [CombineKind.Star]: '+1 ★',
  [CombineKind.Money]: '₽',
}

export function DexScreen({ game }: { game: GameState }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [onlyReady, setOnlyReady] = useState(false)
  const ready = combinableCount(game)
  // Si ya no queda ninguno listo, el filtro se quita solo
  const filtering = onlyReady && ready > 0
  const shown = filtering ? SPECIES.filter((sp) => canCombine(game, sp.id)) : SPECIES
  const starter = game.tutorial === TutorialStep.Combine ? tutorialStarter(game) : undefined

  return (
    <>
      <div className="screen scroll">
        <div className="row between">
          <h2 className="section-title">Pokédex</h2>
          <span className="small">
            Capturados <strong>{game.caught.length}</strong>/{SPECIES.length} · Vistos {game.seen.length}
          </span>
        </div>
        {ready > 0 &&
          (filtering ? (
            <div className="notice small dex-filter">
              <ItemIcon item={ICON.Piece} size={18} />
              <span className="grow">
                Solo los listos para combinar ({ready})
              </span>
              <button className="dex-filter-clear" onClick={() => setOnlyReady(false)} aria-label="Quitar el filtro">
                ✕
              </button>
            </div>
          ) : (
            <button className="notice small dex-filter" onClick={() => setOnlyReady(true)}>
              <ItemIcon item={ICON.Piece} size={18} />
              <span className="grow">
                {ready} {ready === 1 ? 'Pokémon listo' : 'Pokémon listos'} para combinar. Toca aquí para verlos.
              </span>
            </button>
          ))}
        {starter && selectedId !== starter && (
          <TutorialHint>Toca a {species(starter).name} (la casilla que parpadea) para ver sus tickets.</TutorialHint>
        )}
        <div className="dex-grid">
          {shown.map((sp) => {
            const caught = game.caught.includes(sp.id)
            const seen = caught || game.seen.includes(sp.id)
            const pieces = piecesOf(game, sp.id)
            const ready = canCombine(game, sp.id)
            return (
              <button
                key={sp.id}
                className={`dex-cell ${caught ? 'caught' : ''} ${ready ? 'ready' : ''} ${selectedId === sp.id ? 'selected' : ''} ${sp.id === starter && selectedId !== starter ? 'tutorial-target' : ''}`}
                style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color }}
                disabled={!seen && pieces === 0}
                onClick={() => setSelectedId(sp.id)}
              >
                <span className="tiny muted">#{String(sp.id).padStart(3, '0')}</span>
                {isFavorite(game, sp.id) && <HeartIcon size={16} className="dex-favorite" />}
                {ready && <span className="dex-ready-tag tiny">{READY_TAG[combineKind(game, sp.id)]}</span>}
                {seen ? <Sprite id={sp.id} size={72} animated={false} silhouette={!caught} /> : <PixelQuestion size={72} />}
                <span className="tiny">{seen ? sp.name : '???'}</span>
                {pieces > 0 && (
                  <span className="dex-pieces tiny">
                    <ItemIcon item={ICON.Piece} size={14} /> {pieces}/{PIECES_PER_COMBINE}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      {/* Fuera de la lista que hace scroll, para cubrir toda la zona de contenido como la ficha del rancho */}
      {selectedId !== null && <PokemonSheet key={selectedId} game={game} speciesId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  )
}
