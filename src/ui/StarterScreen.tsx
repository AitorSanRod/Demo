import { species, STARTERS } from '../data/species'
import { chooseStarter } from '../game/engine'
import { act } from '../game/store'
import { Sprite, TypeBadge } from './common'

export function StarterScreen() {
  return (
    <div className="screen scroll starter">
      <h1>Pokérancho</h1>
      <p>
        Tu Pokémon recorrerá las rutas por su cuenta. Tú eliges el camino y el movimiento en cada parada, y le ayudas a
        avanzar tocando la pantalla. Si se debilita, vuelve al rancho a descansar.
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
