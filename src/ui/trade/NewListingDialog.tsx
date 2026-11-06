import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { askText, goodText } from '../../game/trade/goodText'
import { GoodKind, type OfferRequest, type TradeAsk } from '../../game/trade/tradeGoods'
import { TradeAction } from '../../game/trade/tradeProtocol'
import { tradeOp } from '../../net/tradeApi'
import { refreshTradeBoard } from '../../net/tradeBoard'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { AskPicker } from './AskPicker'
import { OfferPicker } from './OfferPicker'

/** Poner un anuncio: qué se ofrece y qué se pide; al publicarlo, lo ofrecido sale de la partida */
export function NewListingDialog({ game, onClose, onNotice }: { game: GameState; onClose: () => void; onNotice: (text: string) => void }) {
  const [offer, setOffer] = useState<OfferRequest | null>(null)
  const [ask, setAsk] = useState<TradeAsk | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish() {
    if (!offer || !ask) return
    setBusy(true)
    const outcome = await tradeOp({ action: TradeAction.List, offer, ask })
    setBusy(false)
    if ('error' in outcome) return setError(outcome.error)
    onNotice(`Anuncio publicado: ${goodText(outcome.result.good)} por ${askText(ask)}.`)
    void refreshTradeBoard()
    onClose()
  }

  return (
    <ConfirmDialog title="Nuevo anuncio" confirmLabel={busy ? 'Publicando…' : 'Publicar'} confirmDisabled={busy || !offer || !ask} onConfirm={publish} onCancel={onClose}>
      <div className="trade-new">
        <h4>Ofreces</h4>
        <OfferPicker game={game} value={offer} onChange={setOffer} />
        <h4>Pides a cambio</h4>
        <AskPicker value={ask} onChange={setAsk} />
        {offer?.kind === GoodKind.Mon && <p className="tiny muted">El Pokémon sale de tu partida mientras esté anunciado.</p>}
        {error && <p className="small account-error">{error}</p>}
      </div>
    </ConfirmDialog>
  )
}
