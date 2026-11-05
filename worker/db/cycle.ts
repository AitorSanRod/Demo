import { RAID_ROTATIONS, type RaidRotation } from '../../src/game/raid/online/protocol'
import { cycleBosses, firstCycle, type RaidCycle } from '../../src/game/raid/online/raidCycle'

// Los ciclos de las rotaciones de jefes de la pestaña Raids en D1 (tabla raid_cycles, una fila por rotación), con
// versión como las salas

/** El ciclo tal y como se leyó; `version` null: aún no está guardado (el primero) */
export interface StoredCycle {
  cycle: RaidCycle
  version: number | null
}

interface CycleRow {
  rotation: RaidRotation
  data: string
  version: number
}

/** Los ciclos de todas las rotaciones, en el orden de RAID_ROTATIONS; la que aún no existe empieza sin chocar con las otras */
export async function loadCycles(db: D1Database): Promise<StoredCycle[]> {
  const { results } = await db.prepare('SELECT rotation, data, version FROM raid_cycles').all<CycleRow>()
  const cycles: StoredCycle[] = []
  for (const rotation of RAID_ROTATIONS) {
    const row = results.find((r) => r.rotation === rotation)
    const taken = cycles.flatMap((s) => cycleBosses(s.cycle))
    cycles.push(row ? { cycle: JSON.parse(row.data) as RaidCycle, version: row.version } : { cycle: firstCycle(rotation, taken), version: null })
  }
  return cycles
}

/** Guarda el ciclo si nadie lo ha cambiado desde que se leyó; false si otro llegó antes */
export async function saveCycle(db: D1Database, { cycle, version }: StoredCycle): Promise<boolean> {
  const data = JSON.stringify(cycle)
  const statement =
    version === null
      ? db.prepare('INSERT INTO raid_cycles (rotation, data, version) VALUES (?, ?, 1) ON CONFLICT (rotation) DO NOTHING').bind(cycle.rotation, data)
      : db.prepare('UPDATE raid_cycles SET data = ?, version = version + 1 WHERE rotation = ? AND version = ?').bind(data, cycle.rotation, version)
  const { meta } = await statement.run()
  return meta.changes === 1
}
