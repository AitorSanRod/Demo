import { useState } from 'react'
import { species } from '../../data/species'
import { GoodKind, MAX_ASKED_SPECIES, MAX_TRADE_COUNT, MAX_TRADE_MONEY, type TradeAsk } from '../../game/trade/tradeGoods'
import { Sprite } from '../shared/common'
import { CountInput } from './CountInput'
import { SpeciesSearch } from './SpeciesSearch'

type AskKind = TradeAsk['kind']

const KIND_LABEL: Record<AskKind, string> = {
  [GoodKind.Mon]: 'Pokémon',
  [GoodKind.Money]: 'Dinero',
  [GoodKind.Shards]: 'Trozos',
  [GoodKind.Tickets]: 'Tickets gacha',
}

/** Qué se pide a cambio: de 1 a MAX_ASKED_SPECIES especies (se entrega una), dinero, trozos o tickets de gacha */
export function AskPicker({ value, onChange }: { value: TradeAsk | null; onChange: (ask: TradeAsk | null) => void }) {
  const [kind, setKind] = useState<AskKind>(value?.kind ?? GoodKind.Mon)
  const pick = (next: AskKind) => {
    setKind(next)
    onChange(next === GoodKind.Mon ? null : { kind: next, count: 1 })
  }
  const chosen = value?.kind === GoodKind.Mon ? value.speciesIds : []
  const setSpecies = (ids: number[]) => onChange(ids.length ? { kind: GoodKind.Mon, speciesIds: ids } : null)

  return (
    <>
      <div className="segmented">
        {(Object.keys(KIND_LABEL) as AskKind[]).map((k) => (
          <button key={k} className={kind === k ? 'active' : ''} onClick={() => pick(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {kind === GoodKind.Mon && (
        <>
          <p className="tiny muted">Elige hasta {MAX_ASKED_SPECIES}: quien acepte te dará uno de ellos.</p>
          <div className="trade-chosen">
            {chosen.map((id) => (
              <button key={id} className="trade-species selected" onClick={() => setSpecies(chosen.filter((c) => c !== id))} aria-label={`Quitar ${species(id).name}`}>
                <Sprite id={id} size={44} animated={false} />
                <span className="tiny">{species(id).name} ×</span>
              </button>
            ))}
          </div>
          {chosen.length < MAX_ASKED_SPECIES && <SpeciesSearch placeholder="Buscar Pokémon" exclude={chosen} onPick={(id) => setSpecies([...chosen, id])} />}
        </>
      )}
      {value && value.kind !== GoodKind.Mon && (
        <CountInput
          label={KIND_LABEL[value.kind]}
          value={value.count}
          max={value.kind === GoodKind.Money ? MAX_TRADE_MONEY : MAX_TRADE_COUNT}
          onChange={(count) => onChange({ ...value, count })}
        />
      )}
    </>
  )
}
