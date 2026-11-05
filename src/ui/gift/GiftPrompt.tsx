import { useState } from 'react'
import type { DailyGift } from '../../data/dailyGifts'
import { giftAt, giftIndex } from '../../game/collection/dailyGift'
import { claimDailyGift, giftReady, markGiftPrompted, useDailyGift } from '../../net/dailyGift'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { giftRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

/** Lo que trae el obsequio, para leerlo: «2000 ₽, 50 trozos de MissingNo y 1 ticket» */
function giftText(gift: DailyGift): string {
  const parts = [
    gift.money > 0 && `${gift.money} ₽`,
    gift.missingnoShards > 0 && `${gift.missingnoShards} trozos de MissingNo`,
    gift.tickets > 0 && `${gift.tickets} ticket${gift.tickets > 1 ? 's' : ''}`,
  ].filter((p): p is string => !!p)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '')
}

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
          {gift.big ? ', el día grande' : ''}: {giftText(gift)}. También lo tienes en el Menú del rancho.
        </p>
      </div>
    </ConfirmDialog>
  )
}
