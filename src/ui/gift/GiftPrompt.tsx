import { useState } from 'react'
import { giftAt, giftIndex } from '../../game/collection/dailyGift'
import { claimDailyGift, giftReady, markGiftPrompted, useDailyGift } from '../../net/dailyGift'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { giftRewards } from '../shared/rewardItems'
import { giftText } from './giftText'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

/**
 * Al entrar en el juego, si el obsequio diario de la cuenta está sin recoger, se avisa para recogerlo (una vez por cada
 * vez que se abre la app; si ya está recogido, no sale)
 */
export function GiftPrompt() {
  const view = useDailyGift()
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const [claiming, setClaiming] = useState(false)

  if (report) return <RewardOverlay title="¡Obsequio diario!" items={report} onClose={() => setReport(null)} />
  if (view.prompted || !giftReady(view) || !view.state) return null

  const claimed = view.state.claimed
  const gift = giftAt(claimed)
  const claim = async () => {
    if (claiming) return
    setClaiming(true)
    const got = await claimDailyGift()
    setClaiming(false)
    if (got) setReport(giftRewards(got))
    markGiftPrompted()
  }

  return (
    <ConfirmDialog title="¡Tu obsequio diario te espera!" confirmLabel={claiming ? 'Recogiendo…' : 'Recoger'} cancelLabel="Más tarde" onConfirm={() => void claim()} onCancel={markGiftPrompted}>
      <div className="row gap">
        <ItemIcon item={ICON.Gift} size={64} />
        <p className="small confirm-text">
          Hoy toca el día {giftIndex(claimed) + 1}
          {gift.big ? ', el día grande' : ''}: {giftText(gift)}. También lo tienes en Notificaciones, en el Menú del rancho.
        </p>
      </div>
    </ConfirmDialog>
  )
}
