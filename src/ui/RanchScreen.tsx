import { useState, type CSSProperties } from 'react'
import { species } from '../data/species'
import { findMon, monPlace, type GameState, type OwnedMon } from '../game/state'
import { Sprite } from './common'
import { MonDetail } from './MonDetail'
import { SettingsMenu } from './SettingsMenu'

/** El rancho ocupa toda la pantalla; tocar un Pokémon abre su ficha en una hoja que sube desde abajo */
export function RanchScreen({ game }: { game: GameState }) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const home = game.owned.filter((m) => monPlace(game, m.uid) === 'ranch')
  const mon = selectedUid ? findMon(game, selectedUid) : undefined
  const close = () => setSelectedUid(null)

  return (
    <div className="screen ranch">
      <div className="ranch-field">
        {home.map((m) => (
          <RanchMon
            key={m.uid}
            mon={m}
            selected={m.uid === selectedUid}
            active={m.uid === game.activeUid}
            onClick={() => setSelectedUid(m.uid)}
          />
        ))}
        {home.length === 0 && (
          <p className="ranch-empty small">{game.owned.length === 0 ? 'Aún no tienes Pokémon.' : 'Todos tus Pokémon están fuera.'}</p>
        )}
        <SettingsMenu />
      </div>

      {mon && (
        <div className="ranch-sheet-backdrop" onClick={close}>
          <div className="ranch-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <MonDetail key={mon.uid} game={game} mon={mon} />
            <button className="btn primary wide" onClick={close}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Franja de hierba de la imagen, en % de su altura: entre los árboles de arriba y la valla de abajo */
const GRASS_TOP = 12
const GRASS_HEIGHT = 54

/** Cada Pokémon pasea por el rancho: su posición y su ritmo salen de su uid, así no saltan al refrescar */
function RanchMon({ mon, selected, active, onClick }: { mon: OwnedMon; selected: boolean; active: boolean; onClick: () => void }) {
  const h = hash(mon.uid)
  const top = GRASS_TOP + (h % GRASS_HEIGHT)
  const style = {
    left: `${2 + ((h >>> 6) % 72)}%`,
    top: `${top}%`,
    zIndex: top,
    '--dx': `${24 + ((h >>> 12) % 40)}px`,
    '--dur': `${4 + ((h >>> 18) % 5)}s`,
    '--delay': `-${(h >>> 22) % 8}s`,
  } as CSSProperties

  return (
    <button
      className={`ranch-mon ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${mon.hp < 1 ? 'fainted' : ''}`}
      style={style}
      onClick={onClick}
      aria-label={`${species(mon.speciesId).name} Nv. ${mon.level}`}
    >
      <span className="ranch-face">
        <span className="ranch-hop">
          {active && <span className="ranch-badge">⭐</span>}
          <Sprite id={mon.speciesId} size={64} animated={false} />
        </span>
      </span>
    </button>
  )
}

function hash(text: string): number {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}
