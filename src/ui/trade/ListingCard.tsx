import type { ReactNode } from 'react'
import type { TradeListing } from '../../game/trade/tradeProtocol'
import { serverNow } from '../../net/tradeBoard'
import { formatMinutes } from '../shared/format'
import { AskBadge, GoodBadge } from './GoodBadge'

/** Un anuncio: lo que se ofrece, lo que se pide, quién lo pone, cuánto le queda y su botón */
export function ListingCard({ listing, children }: { listing: TradeListing; children: ReactNode }) {
  // Hacia abajo, para que la cuenta atrás no diga «23 h 60 min»
  const minutesLeft = Math.max(0, Math.floor((listing.expiresAt - serverNow()) / 60_000))

  return (
    <div className="card trade-listing">
      <div className="trade-swap">
        <div className="trade-side">
          <span className="tiny muted">Ofrece</span>
          <GoodBadge good={listing.offer} />
        </div>
        <span className="trade-arrow" aria-hidden="true">
          ⇄
        </span>
        <div className="trade-side">
          <span className="tiny muted">Pide</span>
          <AskBadge ask={listing.ask} />
        </div>
      </div>
      <div className="row between tiny muted">
        <span>{listing.sellerName ?? 'Entrenador'}</span>
        <span>Quedan {formatMinutes(minutesLeft)}</span>
      </div>
      {children}
    </div>
  )
}
