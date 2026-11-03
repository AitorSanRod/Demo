import { useState } from 'react'
import { dexSections } from '../../data/pokedexes'
import { species, SPECIES } from '../../data/species'
import { canCombine, combinableCount } from '../../game/collection/pieces'
import { TutorialStep, type GameState } from '../../game/core/state'
import { tutorialStarter } from '../../game/team/tutorial'
import { TutorialHint } from '../shared/TutorialHint'
import { PokemonSheet } from '../shared/sheet/PokemonSheet'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { DexCell } from './DexCell'
import { DexSection } from './DexSection'
import './dex.css'

const SECTIONS = dexSections()

export function DexScreen({ game }: { game: GameState }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [onlyReady, setOnlyReady] = useState(false)
  const ready = combinableCount(game)
  // Si ya no queda ninguno listo, el filtro se quita solo
  const filtering = onlyReady && ready > 0
  const starter = game.tutorial === TutorialStep.Combine ? tutorialStarter(game) : undefined
  const target = starter !== undefined && selectedId !== starter ? starter : undefined

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
              <span className="grow">Solo los listos para combinar ({ready})</span>
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
        {target !== undefined && (
          <TutorialHint>Toca a {species(target).name} (la casilla que parpadea) para ver sus tickets.</TutorialHint>
        )}
        {SECTIONS.map((section, i) => {
          const shown = filtering ? section.species.filter((sp) => canCombine(game, sp.id)) : section.species
          if (filtering && shown.length === 0) return null
          return (
            <DexSection
              key={section.dex?.id ?? 'national'}
              section={section}
              caught={section.species.filter((sp) => game.caught.includes(sp.id)).length}
              total={section.species.length}
              defaultOpen={i === 0}
              forceOpen={filtering || shown.some((sp) => sp.id === target)}
            >
              {shown.length === 0 ? (
                <p className="muted small dex-section-empty">Aún no hay Pokémon en esta Pokédex.</p>
              ) : (
                <div className="dex-grid">
                  {shown.map((sp) => (
                    <DexCell
                      key={sp.id}
                      game={game}
                      sp={sp}
                      selected={selectedId === sp.id}
                      tutorialTarget={sp.id === target}
                      onSelect={() => setSelectedId(sp.id)}
                    />
                  ))}
                </div>
              )}
            </DexSection>
          )
        })}
      </div>
      {/* Fuera de la lista que hace scroll, para cubrir toda la zona de contenido como la ficha del rancho */}
      {selectedId !== null && <PokemonSheet key={selectedId} game={game} speciesId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  )
}
