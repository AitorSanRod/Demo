import { useState } from 'react'
import { Rarity, RARITY_INFO } from '../../data/species'
import { isSeen, knownName } from '../../game/collection/dex'
import { buyTicket, maxTicketsToBuy, pull, TICKET_PRICE, type PieceDrop } from '../../game/collection/gacha'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Sprite } from '../shared/common'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { CaptureBall } from './CaptureBall'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { StepperAction } from '../shared/sheet/StepperAction'

type Phase = 'idle' | 'capturing' | 'rewards'

/** Máquina de tiradas: gasta tickets y abre la Pokéball con las piezas */
export function GachaMachine({ game }: { game: GameState }) {
  const [drops, setDrops] = useState<PieceDrop[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  // Al tirar tocando la Pokéball no hay caída: ya está ahí y empieza a balancearse
  const [fromBall, setFromBall] = useState(false)
  // Tickets de gacha que se van a comprar, elegidos sin aceptar: siempre al menos 1
  const [buying, setBuying] = useState(1)

  const canPullOne = phase === 'idle' && game.tickets >= 1

  const roll = (count: number, tappedBall = false) => {
    const res = act((s) => pull(s, count))
    if (res.length === 0) return
    setFromBall(tappedBall)
    setDrops(res)
    setPhase('capturing')
  }

  return (
    <>
      <div className="card">
        <div className="label">Probabilidades por ticket</div>
        {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => (
          <div key={r} className="row between small">
            <span style={{ color: RARITY_INFO[r].color }}>● {RARITY_INFO[r].name}</span>
            <span className="muted">{(RARITY_INFO[r].rate * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="card gacha-machine">
        <div className="gacha-stage">
          {phase === 'capturing' ? (
            <CaptureBall glow={RARITY_INFO[bestRarity(drops)].color} drop={!fromBall} onOpen={() => setPhase('rewards')} />
          ) : (
            // Tocar la Pokéball equivale a «Tirar x1»; sin tickets se ve desactivada
            <button
              className="pokeball-button"
              disabled={!canPullOne}
              onClick={() => roll(1, true)}
              aria-label="Tirar x1 (1 ticket de gacha)"
            >
              <span className="pokeball" />
            </button>
          )}
        </div>
        <div className="row gap center">
          <button className="btn primary" disabled={!canPullOne} onClick={() => roll(1)}>
            Tirar x1 <span className="tiny with-icon"><ItemIcon item={ICON.Ticket} size={16} /> 1</span>
          </button>
          <button className="btn primary" disabled={phase !== 'idle' || game.tickets < 10} onClick={() => roll(10)}>
            Tirar x10 <span className="tiny with-icon"><ItemIcon item={ICON.Ticket} size={16} /> 10</span>
          </button>
        </div>
        <StepperAction
          icon={ICON.Ticket}
          label={(n) => (n > 0 ? `Comprar ${n} ${n === 1 ? 'ticket' : 'tickets'}` : 'Comprar tickets')}
          price={(n) => Math.max(1, n) * TICKET_PRICE}
          count={buying}
          min={1}
          max={maxTicketsToBuy(game)}
          onChange={setBuying}
          onAccept={() => {
            act((s) => buyTicket(s, buying))
            setBuying(1)
          }}
        />
      </div>

      {phase === 'rewards' && (
        <RewardOverlay
          title="¡Tickets conseguidos!"
          items={pieceRewards(game, drops)}
          fadeIn={false}
          onClose={() => setPhase('idle')}
        />
      )}
    </>
  )
}

function bestRarity(drops: PieceDrop[]): Rarity {
  return drops.reduce<Rarity>((best, d) => (RARITY_INFO[d.rarity].rate < RARITY_INFO[best].rate ? d.rarity : best), Rarity.Common)
}

/** Agrupa las piezas por especie («Pidgey ×2»); las más raras salen al final y las no vistas, en silueta */
function pieceRewards(game: GameState, drops: PieceDrop[]): RewardItem[] {
  const counts = new Map<number, PieceDrop & { count: number }>()
  for (const d of drops) counts.set(d.speciesId, { ...d, count: (counts.get(d.speciesId)?.count ?? 0) + 1 })
  return [...counts.values()]
    .sort((a, b) => RARITY_INFO[b.rarity].rate - RARITY_INFO[a.rarity].rate)
    .map((d) => ({
      key: String(d.speciesId),
      icon: <Sprite id={d.speciesId} size={160} silhouette={!isSeen(game, d.speciesId)} />,
      title: `Ticket de ${knownName(game, d.speciesId)} ×${d.count}`,
      color: RARITY_INFO[d.rarity].color,
    }))
}
