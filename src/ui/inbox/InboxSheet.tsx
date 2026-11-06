import { useEffect } from 'react'
import { species } from '../../data/species'
import { giftAt, giftIndex } from '../../game/collection/dailyGift'
import type { GameState } from '../../game/core/state'
import { InboxReason } from '../../game/trade/tradeProtocol'
import { receiveBlocker } from '../../game/trade/tradeReceive'
import { AccountStatus, useAccount } from '../../net/account'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { refreshTradeBoard, useTradeBoard } from '../../net/tradeBoard'
import { giftText } from '../gift/giftText'
import { prizeText } from '../raid/useRaidPrizeCollect'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { GoodBadge } from '../trade/GoodBadge'
import { InboxRow } from './InboxRow'
import { useInboxCollect } from './useInboxCollect'
import './inbox.css'

const REASON_TEXT: Record<InboxReason, string> = {
  [InboxReason.Sold]: 'Pago de un anuncio tuyo',
  [InboxReason.Bought]: 'Lo que has conseguido en un intercambio',
  [InboxReason.Expired]: 'Tu anuncio caducó: vuelve a ti',
  [InboxReason.Withdrawn]: 'Has retirado el anuncio: vuelve a ti',
}

/** Notificaciones (menú del rancho): obsequio diario listo, premios de raid y lo que llega de los intercambios */
export function InboxSheet({ game, onBack }: { game: GameState; onBack: () => void }) {
  const { status } = useAccount()
  const giftView = useDailyGift()
  const trades = useTradeBoard().board?.inbox ?? []
  const collect = useInboxCollect()
  useEffect(() => void refreshTradeBoard(), [])
  const gift = giftReady(giftView) && giftView.state ? giftView.state.claimed : null
  const empty = gift === null && game.raidPrizes.length === 0 && trades.length === 0
  const row = (key: string) => ({ collecting: collect.busy === key, disabled: collect.busy !== null })

  return (
    <>
      {collect.overlay}
      <MenuSheetHeader icon={ICON.Inbox} title="Notificaciones" onBack={onBack} />
      {empty ? (
        <p className="notice small">No tienes nada pendiente de recoger.</p>
      ) : (
        <button className="btn primary wide" disabled={collect.busy !== null} onClick={() => void collect.collectAll(gift !== null, trades)}>
          {collect.busy === 'all' ? 'Recogiendo…' : 'Recoger todo'}
        </button>
      )}
      {collect.notice && <p className="small inbox-notice">{collect.notice}</p>}
      {gift !== null && (
        <InboxRow detail={`Obsequio diario, día ${giftIndex(gift) + 1}: ${giftText(giftAt(gift))}`} {...row('gift')} onCollect={() => void collect.collectGift()}>
          <ItemIcon item={ICON.Gift} size={56} />
          <span className="small inbox-thing-name">Obsequio</span>
        </InboxRow>
      )}
      {game.raidPrizes.map((prize, i) => (
        <InboxRow key={`${prize.bossSpeciesId}:${prize.uid}:${i}`} detail={`Premio de raid: ${prizeText(prize)}`} {...row(`prize:${i}`)} onCollect={() => void collect.collectPrize(i)}>
          <Sprite id={prize.bossSpeciesId} size={64} animated={false} />
          <span className="small inbox-thing-name">{species(prize.bossSpeciesId).name}</span>
        </InboxRow>
      ))}
      {trades.map((entry) => (
        <InboxRow key={entry.id} detail={REASON_TEXT[entry.reason]} blocker={receiveBlocker(game, entry.good)} {...row(entry.id)} onCollect={() => void collect.collectTrade(entry)}>
          <GoodBadge good={entry.good} />
        </InboxRow>
      ))}
      {status !== AccountStatus.SignedIn && <p className="tiny muted">Con cuenta, aquí también llegan el obsequio diario y lo de tus intercambios.</p>}
    </>
  )
}
