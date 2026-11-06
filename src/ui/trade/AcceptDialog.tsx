import { useState } from 'react'
import { species } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import type { GameState } from '../../game/core/state'
import { goodText } from '../../game/trade/goodText'
import { giveMonBlocker, payBlocker, payOptions } from '../../game/trade/tradeGive'
import { GoodKind } from '../../game/trade/tradeGoods'
import { TradeAction, type TradeListing } from '../../game/trade/tradeProtocol'
import { duplicateRefund, isDuplicate } from '../../game/trade/tradeReceive'
import { tradeOp } from '../../net/tradeApi'
import { refreshTradeBoard } from '../../net/tradeBoard'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { MonPicker } from '../shared/MonPicker'
import { AskBadge, GoodBadge } from './GoodBadge'

type Step = 'pay' | 'duplicate'

/**
 * Aceptar un anuncio: elegir con qué Pokémon pagar si se pide uno y confirmar. Si lo que llega es un Pokémon que ya se
 * tiene, se avisa de en qué se convertirá y se pide una segunda confirmación
 */
export function AcceptDialog({ game, listing, onClose, onNotice }: { game: GameState; listing: TradeListing; onClose: () => void; onNotice: (text: string) => void }) {
  const [step, setStep] = useState<Step>('pay')
  const [uid, setUid] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { offer, ask } = listing
  const refund = offer.kind === GoodKind.Mon && isDuplicate(game, offer.mon.speciesId) ? duplicateRefund(offer.mon) : null
  const blocker = payBlocker(game, ask, uid ?? null)

  async function accept() {
    setBusy(true)
    const outcome = await tradeOp({ action: TradeAction.Accept, listingId: listing.id, uid: uid ?? null })
    setBusy(false)
    if ('error' in outcome) return setError(outcome.error)
    onNotice(`¡Hecho! ${goodText(offer)} te espera en Notificaciones (Menú del rancho).`)
    void refreshTradeBoard()
    onClose()
  }

  if (step === 'duplicate' && refund) {
    const name = species(refund.speciesId).name
    return (
      <ConfirmDialog title="¿Seguro?" confirmLabel={busy ? 'Aceptando…' : 'Sí, aceptar'} confirmDisabled={busy} onConfirm={accept} onCancel={onClose}>
        <p className="small">
          No tendrás un segundo {name}: al recogerlo recibirás {refund.pieces} tickets de {name} y {refund.money.toLocaleString('es-ES')} ₽.
        </p>
        {error && <p className="small account-error">{error}</p>}
      </ConfirmDialog>
    )
  }

  return (
    <ConfirmDialog
      title="Aceptar intercambio"
      confirmLabel={busy ? 'Aceptando…' : 'Aceptar'}
      confirmDisabled={busy || blocker !== null}
      onConfirm={refund ? () => setStep('duplicate') : accept}
      onCancel={onClose}
    >
      <div className="trade-swap">
        <GoodBadge good={offer} />
        <span className="trade-arrow">⇄</span>
        <AskBadge ask={ask} />
      </div>
      {ask.kind === GoodKind.Mon && (
        <>
          <p className="small muted">Elige cuál de tus Pokémon entregas:</p>
          <MonPicker
            mons={payOptions(game, ask)}
            selectedUid={uid}
            onSelect={setUid}
            lockOf={(m) => (isFavorite(game, m.speciesId) ? 'favorite' : giveMonBlocker(game, m.uid) ? 'other' : null)}
          />
        </>
      )}
      {refund && (
        <p className="small trade-warning">
          Ya tienes a {species(refund.speciesId).name}. Si aceptas, al recogerlo se cambiará por {refund.pieces} tickets de su especie y{' '}
          {refund.money.toLocaleString('es-ES')} ₽.
        </p>
      )}
      {error && <p className="small account-error">{error}</p>}
    </ConfirmDialog>
  )
}
