import { useRef, useState } from 'react'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { moveBlocker, moveMon, placeMon, ranchCount } from '../../game/team/ranches'
import { SettingsMenu } from '../settings/SettingsMenu'
import { PokemonSheet } from '../shared/sheet/PokemonSheet'
import { BoxSheet } from './BoxSheet'
import { RanchMenu } from './RanchMenu'
import type { RanchDrop } from './RanchMon'
import { RanchPage } from './RanchPage'
import { RanchSlots } from './RanchSlots'
import './ranch.css'
import './ranch-controls.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { neighborStyle, useRanchCarousel } from './useRanchCarousel'

/** Milisegundos que se ve el aviso de por qué no se ha podido soltar un Pokémon */
const NOTICE_MS = 2500

/** El rancho ocupa toda la pantalla; tocar un Pokémon abre su ficha a pantalla completa y la Caja sube desde abajo */
export function RanchScreen({ game }: { game: GameState }) {
  const [view, setView] = useState(0)
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [boxOpen, setBoxOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)
  const count = ranchCount(game)
  const ranch = Math.min(view, count - 1)
  const mon = selectedUid ? findMon(game, selectedUid) : undefined
  const close = () => {
    setSelectedUid(null)
    setBoxOpen(false)
  }
  const showNotice = (text: string) => {
    setNotice(text)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }
  const onDrop = (uid: string, drop: RanchDrop) => {
    if (drop.kind === 'spot') return act((s) => placeMon(s, uid, drop.spot))
    const blocker = moveBlocker(game, uid, null)
    if (blocker) return showNotice(blocker)
    act((s) => moveMon(s, uid, null))
  }
  const carousel = useRanchCarousel(count, ranch, setView)
  const pageProps = { game, selectedUid, onSelect: setSelectedUid, onDrop }

  return (
    <div className="screen ranch">
      <div className="ranch-field">
        <div className={`ranch-track ${carousel.settling ? 'settling' : ''}`} {...carousel.trackProps}>
          <RanchPage key={ranch} ranch={ranch} swipe={carousel.swipe} {...pageProps} />
          {carousel.neighbor && (
            <RanchPage key={carousel.neighbor.ranch} ranch={carousel.neighbor.ranch} style={neighborStyle(carousel.neighbor.side)} {...pageProps} />
          )}
        </div>
        <RanchSlots game={game} ranch={ranch} />
        {count > 1 && (
          <>
            <button className="ranch-arrow left" onClick={() => carousel.turn(-1)} aria-label="Rancho anterior" />
            <button className="ranch-arrow right" onClick={() => carousel.turn(1)} aria-label="Rancho siguiente" />
          </>
        )}
        {notice && <p className="ranch-notice small">{notice}</p>}
        <button className="ranch-box-button" onClick={() => setBoxOpen(true)} aria-label="Abrir la Caja">
          <ItemIcon item={ICON.Box} size={34} />
          <span className="tiny">Caja</span>
        </button>
        <RanchMenu game={game} />
        <SettingsMenu />
      </div>

      {mon && <PokemonSheet key={mon.uid} game={game} speciesId={mon.speciesId} onClose={close} />}
      {boxOpen && (
        <div className="ranch-sheet-backdrop" onClick={close}>
          <div className="ranch-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <BoxSheet game={game} />
            <button className="btn primary wide" onClick={close}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
