import { useState } from 'react'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { isFavorite, toggleFavorite } from '../../game/collection/dex'
import { canCombine, combine, combineKind, PIECES_PER_COMBINE, piecesOf, type CombineKind, type CombineResult } from '../../game/collection/pieces'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Bar, Sprite, TypeBadge } from '../shared/common'
import { RevealOverlay } from '../shared/RevealOverlay'
import { TutorialHint } from '../shared/TutorialHint'

const COMBINE_LABEL: Record<CombineKind, string> = {
  unlock: '🧩 Combinar y desbloquear',
  star: '🧩 Combinar: +1 ★',
  money: '🧩 Cambiar 5 piezas por ₽',
}

/** Ficha de una especie vista: sus piezas y el botón para combinarlas */
export function DexPanel({ game, speciesId, onClose }: { game: GameState; speciesId: number; onClose: () => void }) {
  const [result, setResult] = useState<CombineResult | null>(null)
  const sp = species(speciesId)
  const rarity = RARITY_INFO[rarityOf(sp)]
  const owned = game.owned.find((m) => m.speciesId === speciesId)
  const pieces = piecesOf(game, speciesId)
  const kind = combineKind(game, speciesId)
  // Las piezas de un favorito no se pueden triturar
  const favorite = isFavorite(game, speciesId)
  const guided = game.tutorial === 'combine' && canCombine(game, speciesId)

  return (
    <div className="card dex-panel" style={{ ['--rarity' as string]: rarity.color }}>
      <div className="row gap">
        <Sprite id={speciesId} size={64} animated={false} silhouette={!owned} />
        <div className="grow">
          <div className="row between">
            <strong>{sp.name}</strong>
            <span className="row gap">
              <button
                className={`btn small favorite-toggle ${favorite ? 'on' : ''}`}
                onClick={() => act((s) => toggleFavorite(s, speciesId))}
                aria-pressed={favorite}
              >
                {favorite ? '❤️ Favorito' : '🤍 Favorito'}
              </button>
              <button className="hud-close" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </span>
          </div>
          <div className="row gap">
            {sp.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
            <span className="tag" style={{ background: rarity.color }}>
              {rarity.name}
            </span>
          </div>
          <span className="tiny muted">
            {owned ? `En tu equipo · Nv. ${owned.level} · ${'★'.repeat(owned.stars) || 'sin ★'}` : 'Aún no lo tienes'}
          </span>
        </div>
      </div>
      <div className="small row between">
        <span>Piezas</span>
        <span className="muted">
          {pieces}/{PIECES_PER_COMBINE}
        </span>
      </div>
      <Bar value={pieces} max={PIECES_PER_COMBINE} kind="exp" />
      {guided && <TutorialHint>Junta las {PIECES_PER_COMBINE} piezas para conseguir a {sp.name}.</TutorialHint>}
      <button
        className={`btn primary wide ${guided ? 'tutorial-target' : ''}`}
        disabled={!canCombine(game, speciesId)}
        onClick={() => setResult(act((s) => combine(s, speciesId)))}
      >
        {COMBINE_LABEL[kind]}
        {kind === 'money' && ` ${rarity.surplusMoney}`}
      </button>
      {result && (
        <RevealOverlay
          title={RESULT_TITLE[result.kind]}
          speciesId={result.speciesId}
          name={sp.name}
          detail={resultDetail(result)}
          color={rarity.color}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  )
}

const RESULT_TITLE: Record<CombineKind, string> = {
  unlock: '¡Llega al rancho!',
  star: '¡Más fuerte!',
  money: 'Piezas cambiadas',
}

/** Al desbloquear basta con el nombre; en los otros casos se dice qué ha ganado */
function resultDetail(result: CombineResult): string | undefined {
  if (result.kind === 'star') return `${'★'.repeat(result.stars ?? 0)} · +4% a todas las stats`
  if (result.kind === 'money') return `+₽ ${result.money}`
  return undefined
}
