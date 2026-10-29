import { species, STARTERS } from '../data/species'
import { chooseStarter } from '../game/engine'
import { act } from '../game/store'
import { Sprite, TypeBadge } from './common'

export function StarterScreen() {
  return (
    <div className="screen scroll starter">
      <h1>Pokérancho</h1>
      <p>
        Tu Pokémon recorre las rutas por su cuenta: eliges el camino antes de salir y él camina y combate solo.
        En el rancho eliges su movimiento, lo entrenas y mandas al resto de tu equipo de expedición.
      </p>
      <h2 className="section-title">Elige tu compañero</h2>
      <div className="starter-list">
        {STARTERS.map((id) => {
          const sp = species(id)
          return (
            <button key={id} className="card starter-card" onClick={() => act((s) => chooseStarter(s, id))}>
              <Sprite id={id} size={96} />
              <strong>{sp.name}</strong>
              <span className="row gap">
                {sp.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
