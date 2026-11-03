import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { BOX_SLOTS, boxedMons, moveBlocker, moveMon, RANCH_SLOTS, ranchCount, usedSlots, type MonDestination } from '../../../game/team/ranches'
import { ICON } from '../icons'
import { ItemIcon } from '../ItemIcon'
import { MonSection } from './MonSheet'

/** Botones para llevar el Pokémon a otro rancho o a la Caja (o sacarlo de ella); los imposibles salen desactivados */
export function MovePanel({ game, mon, onMoved }: { game: GameState; mon: OwnedMon; onMoved?: () => void }) {
  const destinations: MonDestination[] = [...Array.from({ length: ranchCount(game) }, (_, i) => i), null]
  const options = destinations.filter((to) => to !== mon.ranch)
  if (options.length === 0) return null
  const move = (to: MonDestination) => {
    if (act((s) => moveMon(s, mon.uid, to))) onMoved?.()
  }

  return (
    <MonSection title={mon.ranch === null ? 'Sacar de la Caja a…' : 'Mover a…'}>
      <div className="move-options">
        {options.map((to) => {
          const blocker = moveBlocker(game, mon.uid, to)
          return (
            <button key={to ?? 'box'} className="btn" disabled={!!blocker} title={blocker ?? undefined} onClick={() => move(to)}>
              <span className="with-icon">
                <ItemIcon item={to === null ? ICON.Box : ICON.Ranch} size={22} />
                {to === null ? 'Caja' : `Rancho ${to + 1}`}
              </span>
              <span className="tiny">{to === null ? `${boxedMons(game).length}/${BOX_SLOTS}` : `${usedSlots(game, to)}/${RANCH_SLOTS}`}</span>
            </button>
          )
        })}
      </div>
    </MonSection>
  )
}
