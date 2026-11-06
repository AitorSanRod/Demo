import { useEffect, useState } from 'react'
import { RankingCode } from '../../game/core/ranking'
import { AccountStatus, setRanked, useAccount } from '../../net/account'
import { fetchRanking, type RankingResult } from '../../net/ranking'
import { NicknameDialog } from '../raid/NicknameDialog'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { ICON } from '../shared/icons'
import { RankingBoard } from './RankingBoard'
import './ranking.css'

/**
 * Ranking de dinero (menú del rancho): los jugadores con más dinero y tu puesto. Hace falta cuenta y apodo, y no
 * haberse ocultado del ranking en Ajustes
 */
export function RankingSheet({ onBack }: { onBack: () => void }) {
  const { status, user } = useAccount()
  const [result, setResult] = useState<RankingResult | null>(null)
  const [naming, setNaming] = useState(false)
  const nickname = user?.nickname ?? null
  const ranked = user?.ranked ?? false
  const canView = status === AccountStatus.SignedIn && nickname !== null && ranked

  useEffect(() => {
    if (!canView) return
    let live = true
    void fetchRanking().then((r) => live && setResult(r))
    return () => {
      live = false
    }
  }, [canView, nickname])

  const blocked = status !== AccountStatus.SignedIn ? null : !nickname ? RankingCode.NoNickname : !ranked ? RankingCode.Hidden : null
  const code = blocked ?? (result && 'code' in result ? result.code : null)

  return (
    <>
      <MenuSheetHeader icon={ICON.Ranking} title="Ranking" onBack={onBack} />
      <p className="tiny muted">Celebración de la fiesta capitalista. Se actualiza cada hora.</p>
      {status !== AccountStatus.SignedIn ? (
        <p className="notice small">Para ver el ranking necesitas una cuenta. Entra o crea una en Ajustes › Cuenta.</p>
      ) : code === RankingCode.NoNickname ? (
        <div className="notice small ranking-notice">
          Para ver el ranking y aparecer en él necesitas un apodo.
          <button className="btn primary" onClick={() => setNaming(true)}>
            Poner apodo
          </button>
        </div>
      ) : code === RankingCode.Hidden ? (
        <div className="notice small ranking-notice">
          Has elegido no aparecer en el ranking, así que tampoco puedes verlo.
          <button className="btn primary" onClick={() => void setRanked(true)}>
            Aparecer en el ranking
          </button>
        </div>
      ) : !result ? (
        <p className="small muted">Cargando…</p>
      ) : 'view' in result ? (
        <RankingBoard view={result.view} />
      ) : (
        <p className="notice small">No se ha podido conectar con el servidor. Prueba otra vez en un rato.</p>
      )}
      {naming && <NicknameDialog onDone={() => setNaming(false)} onCancel={() => setNaming(false)} />}
    </>
  )
}
