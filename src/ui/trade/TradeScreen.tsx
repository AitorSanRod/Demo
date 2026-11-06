import { useEffect, useState } from 'react'
import type { GameState } from '../../game/core/state'
import { MAX_OPEN_LISTINGS } from '../../game/trade/tradeGoods'
import { AccountStatus, useAccount } from '../../net/account'
import { useCloud } from '../../net/cloudSync'
import { refreshTradeBoard, useTradeBoard } from '../../net/tradeBoard'
import { AccountDialog } from '../account/AccountDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { MyListings } from './MyListings'
import { TradeBoardView } from './TradeBoardView'
import './trade.css'

type TradeView = 'board' | 'mine'

/** Tienda › Intercambios: con cuenta y la partida en la nube, el tablón de anuncios y los propios */
export function TradeScreen({ game }: { game: GameState }) {
  const { status } = useAccount()
  const cloud = useCloud()
  const trade = useTradeBoard()
  const [view, setView] = useState<TradeView>('board')
  // Aviso de cómo ha ido lo último (aceptar, anunciar, retirar)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => void refreshTradeBoard(), [])

  if (status !== AccountStatus.SignedIn) return <SignInFirst />
  if (cloud.choice) return <p className="screen scroll small muted">Antes de intercambiar, elige qué partida se queda: la de aquí o la de la nube.</p>

  const mine = trade.board?.mine.length ?? 0
  return (
    <div className="screen scroll trade-screen">
      <div className="segmented">
        <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
          Anuncios
        </button>
        <button className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>
          Mis anuncios ({mine}/{MAX_OPEN_LISTINGS})
        </button>
      </div>
      {notice && (
        <button className="card trade-notice small" onClick={() => setNotice(null)}>
          {notice}
        </button>
      )}
      {trade.failing && <p className="small account-error">No se ha podido conectar con el servidor de intercambios.</p>}
      {view === 'board' ? <TradeBoardView game={game} onNotice={setNotice} /> : <MyListings game={game} onNotice={setNotice} />}
    </div>
  )
}

function SignInFirst() {
  const [open, setOpen] = useState(false)
  return (
    <div className="screen scroll">
      <div className="card trade-signin">
        <ItemIcon item={ICON.Trade} size={64} />
        <strong>Intercambia con otros jugadores</strong>
        <p className="small muted">
          Pon a la venta Pokémon, tickets o trozos de MissingNo y acepta los anuncios de los demás. Hace falta una cuenta: así tu partida está
          en la nube y nada se pierde ni se duplica.
        </p>
        <button className="btn primary wide" onClick={() => setOpen(true)}>
          Entrar o crear cuenta
        </button>
      </div>
      {open && <AccountDialog onClose={() => setOpen(false)} />}
    </div>
  )
}
