import { useState } from 'react'
import { species } from '../../../data/species'
import { isSeen, knownName } from '../../../game/collection/dex'
import { canCombine, combine, combineBlocker, CombineKind, combineKind, combinePrice, PIECES_PER_COMBINE, piecesOf, surplusMoney, type CombineResult } from '../../../game/collection/pieces'
import { buyPiece, maxPiecesToBuy, pieceShardPrice } from '../../../game/collection/shredder'
import { TutorialStep, type GameState } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { Bar } from '../common'
import { ICON } from '../icons'
import { TutorialHint } from '../TutorialHint'
import { CombineResultAnimation } from './CombineResultAnimation'
import { BigAction, MonSection } from './MonSheet'
import { StepperAction } from './StepperAction'

const COMBINE_LABEL: Record<CombineKind, string> = {
  [CombineKind.Unlock]: 'Crear Pokémon',
  [CombineKind.Star]: 'Combinar: +1 ★',
  [CombineKind.Money]: 'Cambiar 5 tickets por',
}

/** Sección «Tickets», igual en el rancho y en la Pokédex: cuántos hay, combinarlos y crearlos con trozos */
export function TicketsSection({ game, speciesId }: { game: GameState; speciesId: number }) {
  const [result, setResult] = useState<CombineResult | null>(null)
  // Tickets que se van a canjear por trozos, elegidos sin aceptar
  const [buying, setBuying] = useState(0)
  const seen = isSeen(game, speciesId)
  const pieces = piecesOf(game, speciesId)
  const kind = combineKind(game, speciesId)
  const blocker = combineBlocker(game, speciesId)
  const guided = game.tutorial === TutorialStep.Combine && canCombine(game, speciesId)
  const price = kind === CombineKind.Money ? surplusMoney(speciesId) : combinePrice(game, speciesId)
  const shardPrice = pieceShardPrice(speciesId)

  return (
    <MonSection title="Tickets">
      <div className="mon-tickets">
        <div className="small row between">
          <span>Tickets de {knownName(game, speciesId)}</span>
          <span className="muted">
            {pieces}/{PIECES_PER_COMBINE}
          </span>
        </div>
        <Bar value={pieces} max={PIECES_PER_COMBINE} kind="exp" />
      </div>
      {!seen && <p className="notice small">Encuéntralo en una ruta o en una expedición para poder crearlo.</p>}
      {seen && blocker && pieces >= PIECES_PER_COMBINE && <p className="tiny muted center">{blocker}</p>}
      {guided && <TutorialHint>Junta los {PIECES_PER_COMBINE} tickets para conseguir a {species(speciesId).name}.</TutorialHint>}

      <BigAction
        icon={ICON.Piece}
        label={COMBINE_LABEL[kind]}
        price={price > 0 ? price : undefined}
        disabled={!!blocker}
        className={`${!blocker ? 'primary' : ''} ${guided ? 'tutorial-target' : ''}`}
        onClick={() => setResult(act((s) => combine(s, speciesId)))}
      />
      <StepperAction
        icon={ICON.Shard}
        label={(n) => (n > 0 ? `Crear ${n} ${n === 1 ? 'ticket' : 'tickets'}` : `Crear tickets (tienes ${game.missingnoShards} trozos)`)}
        price={(n) => Math.max(1, n) * shardPrice}
        priceIcon={ICON.Shard}
        count={buying}
        max={maxPiecesToBuy(game, speciesId)}
        onChange={setBuying}
        onAccept={() => {
          act((s) => buyPiece(s, speciesId, buying))
          setBuying(0)
        }}
      />
      {result && <CombineResultAnimation result={result} onClose={() => setResult(null)} />}
    </MonSection>
  )
}
