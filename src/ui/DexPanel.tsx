import { useState } from 'react'
import { RARITY_INFO, rarityOf, species } from '../data/species'
import { canCombine, combine, combineKind, PIECES_PER_COMBINE, piecesOf, type CombineKind, type CombineResult } from '../game/pieces'
import { isFavorite, toggleFavorite } from '../game/dex'
import type { GameState } from '../game/state'
import { act } from '../game/store'
import { Bar, Sprite, TypeBadge } from './common'
import { RewardOverlay, type RewardItem } from './RewardOverlay'

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
      <button
        className="btn primary wide"
        disabled={!canCombine(game, speciesId)}
        onClick={() => setResult(act((s) => combine(s, speciesId)))}
      >
        {COMBINE_LABEL[kind]}
        {kind === 'money' && ` ${rarity.dupeMoney}`}
      </button>
      {result && (
        <RewardOverlay title={RESULT_TITLE[result.kind]} items={[combineReward(result)]} onClose={() => setResult(null)} />
      )}
    </div>
  )
}

const RESULT_TITLE: Record<CombineKind, string> = {
  unlock: '¡Nuevo Pokémon!',
  star: '¡Más fuerte!',
  money: 'Piezas cambiadas',
}

function combineReward(result: CombineResult): RewardItem {
  const sp = species(result.speciesId)
  const detail = {
    unlock: `Llega al rancho con Nv. ${result.level}`,
    star: `${'★'.repeat(result.stars ?? 0)} · +4% a todas las stats`,
    money: `+₽ ${result.money}`,
  }[result.kind]
  return {
    key: result.kind,
    icon: <Sprite id={result.speciesId} size={120} />,
    title: sp.name,
    detail,
    color: RARITY_INFO[rarityOf(sp)].color,
  }
}
