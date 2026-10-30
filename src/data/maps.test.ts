import { describe, expect, it } from 'vitest'
import { isValidPath, KANTO, pathFrom, type Route } from './maps'

function reachableIds(r: Route): Set<string> {
  const byId = new Map(r.nodes.map((n) => [n.id, n]))
  const start = r.nodes.find((n) => n.kind === 'start')!
  const seen = new Set([start.id])
  const queue = [start]
  for (const current of queue) {
    for (const edge of current.next) {
      if (seen.has(edge.to)) continue
      seen.add(edge.to)
      queue.push(byId.get(edge.to)!)
    }
  }
  return seen
}

describe.each(KANTO.routes)('ruta $id', (r) => {
  const ids = new Set(r.nodes.map((n) => n.id))

  it('tiene exactamente un nodo de inicio', () => {
    expect(r.nodes.filter((n) => n.kind === 'start')).toHaveLength(1)
  })

  it('todos los caminos llevan a nodos existentes', () => {
    for (const n of r.nodes) for (const e of n.next) expect(ids).toContain(e.to)
  })

  it('todos los nodos son alcanzables desde el inicio', () => {
    expect(reachableIds(r)).toEqual(ids)
  })

  it('el camino por defecto es válido', () => {
    expect(isValidPath(r, pathFrom(r))).toBe(true)
  })

  it('cada lista de encuentros suma 100% y no tiene probabilidades a 0', () => {
    const pools = [r.encounters, ...r.nodes.map((n) => n.encounters ?? r.encounters)]
    for (const pool of pools) {
      expect(pool.reduce((sum, e) => sum + e.chance, 0)).toBe(100)
      for (const e of pool) expect(e.chance).toBeGreaterThan(0)
    }
  })

  it('las paradas de jefe tienen su Pokémon y nivel, y las demás no', () => {
    for (const n of r.nodes) {
      if (n.kind === 'boss') expect(n.boss?.level).toBeGreaterThan(0)
      else expect(n.boss).toBeUndefined()
    }
  })

  it('desbloquea una ruta existente', () => {
    if (r.unlocks) expect(KANTO.routes.map((x) => x.id)).toContain(r.unlocks)
  })
})

describe('caminos con bifurcación', () => {
  const forked: Route = {
    ...KANTO.routes[0],
    nodes: [
      { id: 's', name: 'Inicio', kind: 'start', next: [{ to: 'a', steps: 10 }, { to: 'b', steps: 10 }] },
      { id: 'a', name: 'A', kind: 'wild', next: [{ to: 'z', steps: 10 }] },
      { id: 'b', name: 'B', kind: 'wild', next: [{ to: 'z', steps: 10 }] },
      { id: 'z', name: 'Fin', kind: 'wild', next: [] },
    ],
  }

  it('por defecto toma la primera opción', () => {
    expect(pathFrom(forked)).toEqual(['s', 'a', 'z'])
  })

  it('se puede continuar desde la rama elegida', () => {
    expect(pathFrom(forked, 'b')).toEqual(['b', 'z'])
  })

  it('acepta cualquier rama y rechaza saltos, nodos inexistentes o caminos sin terminar', () => {
    expect(isValidPath(forked, ['s', 'b', 'z'])).toBe(true)
    expect(isValidPath(forked, ['s', 'z'])).toBe(false)
    expect(isValidPath(forked, ['s', 'a'])).toBe(false)
    expect(isValidPath(forked, ['s', 'x', 'z'])).toBe(false)
  })
})
