import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { MAX_OPEN_LISTINGS } from '../../game/trade/tradeGoods'
import type { TradeListing } from '../../game/trade/tradeProtocol'
import { requestWithdraw } from '../../net/tradeApi'
import { refreshTradeBoard, useTradeBoard } from '../../net/tradeBoard'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ListingCard } from './ListingCard'
import { NewListingDialog } from './NewListingDialog'

const WITHDRAW_TEXT = {
  done: 'Anuncio retirado: lo tienes en Notificaciones (Menú del rancho).',
  late: 'No se ha podido retirar: el anuncio ya se había cerrado. Mira tus Notificaciones.',
  offline: 'No se ha podido hablar con el servidor. Prueba otra vez.',
}

/** Los anuncios propios abiertos: cuánto les queda, retirarlos y poner uno nuevo */
export function MyListings({ game, onNotice }: { game: GameState; onNotice: (text: string) => void }) {
  const trade = useTradeBoard()
  const [creating, setCreating] = useState(false)
  const [confirming, setConfirming] = useState<TradeListing | null>(null)
  // Retiradas pedidas al servidor y aún sin respuesta
  const [pending, setPending] = useState<string[]>([])
  const mine = trade.board?.mine ?? []

  async function withdraw(listing: TradeListing) {
    setConfirming(null)
    setPending((p) => [...p, listing.id])
    const withdrawn = await requestWithdraw(listing.id)
    onNotice(withdrawn === null ? WITHDRAW_TEXT.offline : withdrawn ? WITHDRAW_TEXT.done : WITHDRAW_TEXT.late)
    await refreshTradeBoard()
    setPending((p) => p.filter((id) => id !== listing.id))
  }

  return (
    <>
      <button className="btn primary wide" disabled={mine.length >= MAX_OPEN_LISTINGS} onClick={() => setCreating(true)}>
        {mine.length >= MAX_OPEN_LISTINGS ? `Máximo ${MAX_OPEN_LISTINGS} anuncios` : 'Nuevo anuncio'}
      </button>
      <p className="tiny muted">Lo que anuncias sale de tu partida. Si en 24 h nadie lo acepta, vuelve a ti en Notificaciones.</p>
      {mine.map((listing) => (
        <ListingCard key={listing.id} listing={listing}>
          <button className="btn wide" disabled={pending.includes(listing.id)} onClick={() => setConfirming(listing)}>
            {pending.includes(listing.id) ? 'Retirada pendiente…' : 'Retirar'}
          </button>
        </ListingCard>
      ))}
      {confirming && (
        <ConfirmDialog title="¿Retirar el anuncio?" confirmLabel="Retirar" onConfirm={() => void withdraw(confirming)} onCancel={() => setConfirming(null)}>
          <p className="small">Si nadie lo ha aceptado aún, lo anunciado volverá a ti en Notificaciones.</p>
        </ConfirmDialog>
      )}
      {creating && <NewListingDialog game={game} onClose={() => setCreating(false)} onNotice={onNotice} />}
    </>
  )
}
