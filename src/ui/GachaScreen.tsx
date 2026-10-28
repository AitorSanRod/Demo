import { useEffect, useState } from 'react'
import { RARITY_INFO, species, type Rarity } from '../data/species'
import { buyTicket, pull, TICKET_PRICE, type PullResult } from '../game/gacha'
import type { GameState } from '../game/state'
import { act } from '../game/store'
import { Sprite } from './common'

const REVEAL_MS = 1100

export function GachaScreen({ game }: { game: GameState }) {
  const [results, setResults] = useState<PullResult[]>([])
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (!rolling) return
    const t = setTimeout(() => setRolling(false), REVEAL_MS)
    return () => clearTimeout(t)
  }, [rolling])

  const roll = (count: number) => {
    const res = act((s) => {
      const out: PullResult[] = []
      for (let i = 0; i < count; i++) {
        const r = pull(s)
        if (r) out.push(r)
      }
      return out
    })
    if (res.length === 0) return
    setResults(res)
    setRolling(true)
  }

  const best = results.reduce<Rarity>((acc, r) => (RARITY_INFO[r.rarity].rate < RARITY_INFO[acc].rate ? r.rarity : acc), 'common')

  return (
    <div className="screen scroll">
      <div className="card gacha-machine">
        <div className="gacha-stage" style={{ ['--glow' as string]: RARITY_INFO[best].color }}>
          {rolling ? (
            <div className="pokeball shaking" />
          ) : results.length === 0 ? (
            <div className="pokeball" />
          ) : (
            <div className={`gacha-results ${results.length > 1 ? 'many' : ''}`}>
              {results.map((r, i) => (
                <PullCard key={i} result={r} big={results.length === 1} />
              ))}
            </div>
          )}
        </div>
        <div className="row gap center">
          <button className="btn primary" disabled={rolling || game.tickets < 1} onClick={() => roll(1)}>
            Tirar x1 <span className="tiny">🎟 1</span>
          </button>
          <button className="btn primary" disabled={rolling || game.tickets < 10} onClick={() => roll(10)}>
            Tirar x10 <span className="tiny">🎟 10</span>
          </button>
        </div>
        <button className="btn ghost small" disabled={game.money < TICKET_PRICE} onClick={() => act(buyTicket)}>
          Comprar 1 ticket por ₽ {TICKET_PRICE}
        </button>
      </div>

      <div className="card">
        <div className="label">Probabilidades</div>
        {(Object.keys(RARITY_INFO) as Rarity[]).map((r) => (
          <div key={r} className="row between small">
            <span style={{ color: RARITY_INFO[r].color }}>● {RARITY_INFO[r].name}</span>
            <span className="muted">
              {(RARITY_INFO[r].rate * 100).toFixed(0)}% · duplicado: +★ y ₽ {RARITY_INFO[r].dupeMoney}
            </span>
          </div>
        ))}
        <p className="tiny muted">La rareza depende de las estadísticas base. Cada ★ da +4% a todas las stats (máx. 5).</p>
      </div>
    </div>
  )
}

function PullCard({ result, big }: { result: PullResult; big: boolean }) {
  const info = RARITY_INFO[result.rarity]
  return (
    <div className="pull-card" style={{ ['--rarity' as string]: info.color }}>
      <Sprite id={result.speciesId} size={big ? 120 : 56} />
      {big && <strong>{species(result.speciesId).name}</strong>}
      <span className="tiny" style={{ color: info.color }}>
        {result.isNew ? '¡NUEVO!' : `★${result.stars} +₽${result.money}`}
      </span>
      {big && <span className="tiny muted">{info.name}</span>}
    </div>
  )
}
