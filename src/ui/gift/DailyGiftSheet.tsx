import { useEffect, useState } from 'react'
import { DAILY_GIFTS, type DailyGift } from '../../data/dailyGifts'
import { canClaimGift, giftAvailableAt, giftIndex } from '../../game/collection/dailyGift'
import { AccountStatus, useAccount } from '../../net/account'
import { claimDailyGift, giftNow, useDailyGift } from '../../net/dailyGift'
import { AccountDialog } from '../account/AccountDialog'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { giftRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { BigAction } from '../shared/sheet/MonSheet'
import './gift.css'

/** Cada cuánto se repinta la cuenta atrás */
const TICK_MS = 1000

type DayState = 'done' | 'next' | 'later'

/** Obsequio diario: los días del ciclo, el que toca y recogerlo (o cuánto falta). Es de las cuentas */
export function DailyGiftSheet({ onBack }: { onBack: () => void }) {
  const { status } = useAccount()
  const view = useDailyGift()
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const claim = async () => {
    setClaiming(true)
    const gift = await claimDailyGift()
    setClaiming(false)
    if (gift) setReport(giftRewards(gift))
  }
  const state = view.state
  const next = state ? giftIndex(state.claimed) : 0
  const dayState = (i: number): DayState => (i < next ? 'done' : i === next ? 'next' : 'later')

  return (
    <>
      {report && <RewardOverlay title="¡Obsequio diario!" items={report} onClose={() => setReport(null)} />}
      <div className="row between">
        <h2 className="with-icon">
          <ItemIcon item={ICON.Gift} size={32} /> Obsequio diario
        </h2>
        <button className="account-link" onClick={onBack}>
          Menú
        </button>
      </div>
      <p className="tiny muted">Uno cada 24 horas; cada vez, el siguiente día del ciclo, aunque pasen días sin entrar.</p>
      <div className="gift-days">
        {DAILY_GIFTS.map((gift, i) => (
          <GiftDay key={i} day={i + 1} gift={gift} state={status === AccountStatus.SignedIn ? dayState(i) : 'later'} />
        ))}
      </div>
      {status !== AccountStatus.SignedIn ? (
        <>
          <p className="small">El obsequio diario es de tu cuenta: entra o crea una y recógelo desde cualquier dispositivo.</p>
          <BigAction icon={ICON.Account} label="Entrar en tu cuenta" className="primary" onClick={() => setAccountOpen(true)} />
        </>
      ) : !state ? (
        <p className="small muted">{view.failing ? 'Sin conexión con el servidor: reintentando…' : 'Mirando tu obsequio…'}</p>
      ) : canClaimGift(state, giftNow(view)) ? (
        <BigAction icon={ICON.Gift} label={claiming ? 'Recogiendo…' : `Recoger el día ${next + 1}`} className="primary" disabled={claiming} onClick={() => void claim()} />
      ) : (
        <p className="small gift-wait">Siguiente obsequio en {formatClock(giftAvailableAt(state) - giftNow(view))}</p>
      )}
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
    </>
  )
}

function GiftDay({ day, gift, state }: { day: number; gift: DailyGift; state: DayState }) {
  return (
    <div className={`gift-day ${state} ${gift.big ? 'big' : ''}`}>
      <strong className="small">{gift.big ? `Día ${day} · Día grande` : `Día ${day}`}</strong>
      <div className="gift-contents">
        {gift.money > 0 && <span className="small">₽ {gift.money}</span>}
        {gift.missingnoShards > 0 && (
          <span className="small with-icon">
            <ItemIcon item={ICON.Shard} size={22} /> ×{gift.missingnoShards}
          </span>
        )}
        {gift.tickets > 0 && (
          <span className="small with-icon">
            <ItemIcon item={ICON.Ticket} size={22} /> ×{gift.tickets}
          </span>
        )}
      </div>
      {state === 'done' && <span className="tiny muted">Recogido</span>}
      {state === 'next' && <span className="tiny gift-next">Hoy</span>}
    </div>
  )
}
