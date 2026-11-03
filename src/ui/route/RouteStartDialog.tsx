import { createPortal } from 'react-dom'
import { pathFrom, pathSpecies, type Route } from '../../data/maps'
import { signatureMove } from '../../data/moves'
import { species } from '../../data/species'
import { TutorialStep, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { startRun } from '../../game/run/run'
import { maxHp } from '../../game/team/stats'
import { Bar, Sprite } from '../shared/common'
import { PixelQuestion } from '../shared/PixelQuestion'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { TutorialHint } from '../shared/TutorialHint'
import '../shared/overlays.css'
import './route-start.css'

/**
 * Confirmación antes de salir: el paisaje de la ruta con el Pokémon que va, y los Pokémon que pueden aparecer (los no
 * vistos, como ¿ pixelada). Se sale siempre por el camino principal.
 */
export function RouteStartDialog({ game, route: r, mon, onClose }: { game: GameState; route: Route; mon: OwnedMon; onClose: () => void }) {
  const path = pathFrom(r)
  const sp = species(mon.speciesId)
  const hpMax = maxHp(mon)
  const guided = game.tutorial === TutorialStep.Route

  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card route-start" role="dialog" aria-modal="true" aria-label={`Comenzar ${r.name}`} onClick={(e) => e.stopPropagation()}>
        <HeroLayout
          compact
          scenery={BIOME_SCENERY[r.biome]}
          name={r.name}
          subtitle={`Nv. ${r.levels[0]}–${r.levels[1]}`}
          footer={
            <>
              <Bar value={mon.hp} max={hpMax} kind="hp" />
              <span className="small">
                {Math.floor(mon.hp)} / {hpMax} PS
              </span>
            </>
          }
        >
          <Sprite id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" />
        </HeroLayout>
        <div className="route-start-body">
          <p className="small center">
            Sale <strong>{sp.name}</strong> (Nv. {mon.level}), que ataca con <strong>{signatureMove(mon.speciesId).name}</strong>.
          </p>
          <div className="label">Pueden aparecer</div>
          <div className="route-start-species">
            {pathSpecies(r, path).map((id) =>
              game.seen.includes(id) ? <Sprite key={id} id={id} size={48} animated={false} /> : <PixelQuestion key={id} size={40} />,
            )}
          </div>
          {guided && <TutorialHint>Tu Pokémon caminará solo y combatirá en cada parada. ¡Pulsa «¡En marcha!» y a partir de aquí juega a tu aire!</TutorialHint>}
          <div className="row gap confirm-actions">
            <button className="btn grow" onClick={onClose}>
              Cancelar
            </button>
            <button className={`btn primary grow ${guided ? 'tutorial-target' : ''}`} onClick={() => act((s) => startRun(s, r.id, path))}>
              ¡En marcha!
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
