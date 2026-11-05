import { describe, expect, it } from 'vitest'
import { KANTO } from '../../../data/maps'
import { pixelSceneFor } from './index'

describe.each(KANTO.routes)('elementos de parada de $id', (r) => {
  it('la escena de su bioma dibuja el elemento de cada parada', () => {
    const drawn = pixelSceneFor(r.biome).landmarks.map((l) => l.id)
    for (const n of r.nodes) if (n.landmark) expect(drawn).toContain(n.landmark)
  })
})
