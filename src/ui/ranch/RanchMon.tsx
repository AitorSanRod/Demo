import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { species } from '../../data/species'
import type { OwnedMon, RanchSpot } from '../../game/core/state'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Franja de hierba de la imagen, en % de su altura: entre los árboles de arriba y la valla de abajo */
const GRASS_TOP = 12
const GRASS_HEIGHT = 50
/** Píxeles que hay que mover el dedo para que un toque pase a ser un arrastre */
const DRAG_THRESHOLD_PX = 8
const SPRITE_PX = 96
/** Hasta dónde (en % del ancho) puede salir un Pokémon colocado al azar, para que el sprite y su paseo quepan */
const MAX_RANDOM_X = 60

/** Dónde se ha soltado: en un punto del prado (en %) o encima del botón de la Caja */
export type RanchDrop = { kind: 'spot'; spot: RanchSpot } | { kind: 'box' }

interface Props {
  mon: OwnedMon
  selected: boolean
  active: boolean
  onClick: () => void
  onDrop: (drop: RanchDrop) => void
}

/** Cada Pokémon pasea por el rancho desde su sitio (el elegido arrastrándolo o uno fijo sacado de su uid) */
export function RanchMon({ mon, selected, active, onClick, onDrop }: Props) {
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null)
  const h = hash(mon.uid)
  const spot = mon.spot ?? { x: 2 + ((h >>> 6) % MAX_RANDOM_X), y: GRASS_TOP + (h % GRASS_HEIGHT) }
  const style = {
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    zIndex: offset ? 1000 : Math.round(spot.y),
    translate: offset ? `${offset.x}px ${offset.y}px` : undefined,
    '--dx': `${24 + ((h >>> 12) % 40)}px`,
    '--dur': `${4 + ((h >>> 18) % 5)}s`,
    '--delay': `-${(h >>> 22) % 8}s`,
  } as CSSProperties

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current) return
    const moved = { x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }
    if (offset || Math.hypot(moved.x, moved.y) > DRAG_THRESHOLD_PX) setOffset(moved)
  }
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = null
    if (!offset) return onClick()
    setOffset(null)
    if (isOver(document.querySelector('.ranch-box-button'), e)) return onDrop({ kind: 'box' })
    const field = e.currentTarget.offsetParent!.getBoundingClientRect()
    const x = ((e.clientX - field.left - SPRITE_PX / 2) / field.width) * 100
    const y = ((e.clientY - field.top - SPRITE_PX / 2) / field.height) * 100
    onDrop({ kind: 'spot', spot: { x: clamp(x, 0, 100 - (SPRITE_PX / field.width) * 100), y: clamp(y, GRASS_TOP, GRASS_TOP + GRASS_HEIGHT) } })
  }

  return (
    <button
      className={`ranch-mon ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${mon.hp < 1 ? 'fainted' : ''} ${offset ? 'dragging' : ''}`}
      style={style}
      // Con el teclado no hay puntero: el clic llega con detail 0
      onClick={(e) => e.detail === 0 && onClick()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null
        setOffset(null)
      }}
      aria-label={`${species(mon.speciesId).name} Nv. ${mon.level}`}
    >
      <span className="ranch-face">
        <span className="ranch-hop">
          {active && <ItemIcon item={ICON.Active} size={18} className="ranch-badge" />}
          <Sprite id={mon.speciesId} size={SPRITE_PX} animated={false} />
        </span>
      </span>
    </button>
  )
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** El propio Pokémon arrastrado está bajo el dedo, así que se mira el rectángulo del destino */
function isOver(el: Element | null, e: PointerEvent) {
  const r = el?.getBoundingClientRect()
  return !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
}

function hash(text: string): number {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}
