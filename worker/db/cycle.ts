import { firstCycle, type RaidCycle } from '../../src/game/raid/online/raidCycle'

// El ciclo del jefe de la pestaña Raids en D1 (tabla raid_cycle, una sola fila), con versión como las salas

/** El ciclo tal y como se leyó; `version` null: aún no está guardado (el primero) */
export interface StoredCycle {
  cycle: RaidCycle
  version: number | null
}

interface CycleRow {
  data: string
  version: number
}

export async function loadCycle(db: D1Database): Promise<StoredCycle> {
  const row = await db.prepare('SELECT data, version FROM raid_cycle WHERE id = 1').first<CycleRow>()
  return row ? { cycle: JSON.parse(row.data) as RaidCycle, version: row.version } : { cycle: firstCycle(), version: null }
}

/** Guarda el ciclo si nadie lo ha cambiado desde que se leyó; false si otro llegó antes */
export async function saveCycle(db: D1Database, { cycle, version }: StoredCycle): Promise<boolean> {
  const data = JSON.stringify(cycle)
  const statement =
    version === null
      ? db.prepare('INSERT INTO raid_cycle (id, data, version) VALUES (1, ?, 1) ON CONFLICT (id) DO NOTHING').bind(data)
      : db.prepare('UPDATE raid_cycle SET data = ?, version = version + 1 WHERE id = 1 AND version = ?').bind(data, version)
  const { meta } = await statement.run()
  return meta.changes === 1
}
