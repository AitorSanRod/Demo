import { useEffect, useState } from 'react'
import type { GameState } from '../../game/core/state'
import { canPay } from '../../game/trade/tradeGive'
import { MAX_SEARCH_SPECIES, type TradeListing } from '../../game/trade/tradeProtocol'
import { refreshTradeBoard, useTradeBoard } from '../../net/tradeBoard'
import { AcceptDialog } from './AcceptDialog'
import { ListingCard } from './ListingCard'
import { matchingSpecies } from './speciesMatch'

/** Milisegundos sin escribir antes de buscar */
const SEARCH_DELAY_MS = 350

/** Los anuncios de los demás, con buscador por especie; aceptar abre el diálogo de pago */
export function TradeBoardView({ game, onNotice }: { game: GameState; onNotice: (text: string) => void }) {
  const trade = useTradeBoard()
  const [text, setText] = useState('')
  const [accepting, setAccepting] = useState<TradeListing | null>(null)
  const matches = matchingSpecies(text).slice(0, MAX_SEARCH_SPECIES)
  const noMatch = text.trim() !== '' && matches.length === 0
  const searchKey = matches.join(',')

  useEffect(() => {
    if (noMatch) return
    const id = setTimeout(() => void refreshTradeBoard(searchKey ? searchKey.split(',').map(Number) : []), SEARCH_DELAY_MS)
    return () => clearTimeout(id)
  }, [searchKey, noMatch])

  const listings = noMatch ? [] : (trade.board?.listings ?? [])
  return (
    <>
      <input className="text-input" type="search" value={text} placeholder="Buscar por Pokémon" onChange={(e) => setText(e.target.value)} />
      {listings.length === 0 && <p className="small muted">{trade.loading ? 'Cargando…' : 'No hay anuncios que mostrar.'}</p>}
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing}>
          <button className="btn primary wide" disabled={!canPay(game, listing.ask)} onClick={() => setAccepting(listing)}>
            {canPay(game, listing.ask) ? 'Aceptar' : 'No tienes lo que pide'}
          </button>
        </ListingCard>
      ))}
      {accepting && <AcceptDialog game={game} listing={accepting} onClose={() => setAccepting(null)} onNotice={onNotice} />}
    </>
  )
}
