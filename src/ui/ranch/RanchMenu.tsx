import { useState } from 'react'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { DailyGiftSheet } from '../gift/DailyGiftSheet'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

type Panel = 'menu' | 'gift'

/** Botón de menú del rancho (esquina inferior derecha) y lo que abre: por ahora, el obsequio diario */
export function RanchMenu() {
  const [panel, setPanel] = useState<Panel | null>(null)
  const gift = useDailyGift()
  const ready = giftReady(gift)
  const close = () => setPanel(null)

  return (
    <>
      <button className="ranch-menu-button" onClick={() => setPanel('menu')} aria-label="Abrir el menú">
        <ItemIcon item={ICON.Menu} size={34} />
        <span className="tiny">Menú</span>
        {ready && <span className="dot" />}
      </button>
      {panel && (
        <div className="ranch-sheet-backdrop" onClick={close}>
          <div className="ranch-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {panel === 'gift' ? (
              <DailyGiftSheet onBack={() => setPanel('menu')} />
            ) : (
              <>
                <h2 className="with-icon">
                  <ItemIcon item={ICON.Menu} size={32} /> Menú
                </h2>
                <button className="ranch-menu-item" onClick={() => setPanel('gift')}>
                  <ItemIcon item={ICON.Gift} size={36} />
                  <span className="grow">
                    <strong>Obsequio diario</strong>
                    <span className="tiny muted ranch-menu-hint">{ready ? '¡Ya puedes recogerlo!' : 'Un regalo cada día, en ciclo'}</span>
                  </span>
                  {ready && <span className="dot" />}
                </button>
              </>
            )}
            <button className="btn primary wide" onClick={close}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
