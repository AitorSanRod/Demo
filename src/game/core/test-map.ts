import { boss, chain, enc, NodeKind, RouteId, Biome, type GameMap } from '../../data/maps/mapCommon'
import { POKEMON } from '../../data/pokemon'

/**
 * Mapa de mentira para los tests del motor, para que editar las rutas reales nunca rompa un test:
 * `vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))`
 */
export const KANTO: GameMap = {
  id: 'test',
  name: 'Mapa de prueba',
  routes: [
    {
      id: RouteId.PuebloPaleta,
      name: 'Ruta inicial',
      description: '',
      biome: Biome.Meadow,
      levels: [2, 3],
      encounters: enc([POKEMON.Pidgey, 100]),
      reward: { tickets: 1, money: 10, exp: 100, firstClearTickets: 3 },
      unlocks: RouteId.Ruta1,
      nodes: chain(
        { id: 's', name: 'Inicio', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Primera', kind: NodeKind.Wild, steps: 20 },
        { id: 'b', name: 'Última', kind: NodeKind.Wild, steps: 20 },
      ),
    },
    {
      id: RouteId.Ruta1,
      name: 'Ruta con jefe',
      description: '',
      biome: Biome.Meadow,
      levels: [3, 4],
      encounters: enc([POKEMON.Rattata, 100]),
      reward: { tickets: 1, money: 20, exp: 200 },
      nodes: chain(
        { id: 's', name: 'Inicio', kind: NodeKind.Start, steps: 0 },
        { id: 'a', name: 'Salvaje', kind: NodeKind.Wild, steps: 20 },
        { id: 'z', name: 'Jefe', kind: NodeKind.Boss, steps: 20, boss: boss(POKEMON.Pidgeotto, 7) },
      ),
    },
  ],
}
