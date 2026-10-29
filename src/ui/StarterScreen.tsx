import { useState } from 'react'
import { STARTERS } from '../data/species'
import { act } from '../game/store'
import { pickStarter, STARTER_PIECES } from '../game/tutorial'
import { Sprite } from './common'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Primer paso del tutorial: a oscuras, tres Pokéball en triángulo. Cada una muestra la silueta de un inicial
 * bajo un foco de luz y se elige uno a ciegas.
 */
export function StarterScreen() {
  const [opened, setOpened] = useState<number[]>([])
  const [chosen, setChosen] = useState<number | null>(null)

  return (
    <div className="screen starter">
      <div className="starter-triangle">
        {STARTERS.map((id, i) =>
          opened.includes(id) ? (
            <button
              key={id}
              className={`starter-slot slot-${i} revealed`}
              onClick={() => setChosen(id)}
              aria-label="Elegir este Pokémon"
            >
              <Sprite id={id} size={112} silhouette />
            </button>
          ) : (
            <button
              key={id}
              className={`starter-slot slot-${i}`}
              onClick={() => setOpened((o) => [...o, id])}
              aria-label="Abrir Pokéball"
            >
              <span className="pokeball starter-ball" />
            </button>
          ),
        )}
      </div>
      <p className="starter-hint small">
        {opened.length === 0 ? 'Toca una Pokéball' : 'Toca una silueta para elegir a tu compañero'}
      </p>
      {chosen !== null && (
        <ConfirmDialog
          title="¿Este será tu compañero?"
          confirmLabel="¡Lo quiero!"
          onConfirm={() => act((s) => pickStarter(s, chosen))}
          onCancel={() => setChosen(null)}
        >
          <div className="row gap">
            <Sprite id={chosen} size={72} silhouette />
            <p className="small confirm-text">
              Recibirás {STARTER_PIECES} piezas de este Pokémon. No podrás cambiarlo después.
            </p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
