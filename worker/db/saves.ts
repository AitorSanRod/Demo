import type { CloudSave } from '../../src/game/core/cloudSave'

// Partidas en la nube en D1 (tabla saves): una por cuenta. Subir solo vale encima de la revisión que el dispositivo
// vio por última vez y con un sello de intercambios que no sea más viejo que el de la nube (ver trade/tradeOps.ts); la
// comprobación va en la misma consulta, así dos subidas a la vez no se pisan.

interface SaveRow {
  data: string
}

export async function loadSave(db: D1Database, userId: string): Promise<CloudSave | null> {
  const row = await db.prepare('SELECT data FROM saves WHERE user_id = ?').bind(userId).first<SaveRow>()
  return row && (JSON.parse(row.data) as CloudSave)
}

/** El sello de intercambios de una partida subida (las de antes de los intercambios no lo tienen: 0) */
export const tradeStampOf = (cloud: CloudSave): number => (Number.isInteger(cloud.save.tradeStamp) ? cloud.save.tradeStamp : 0)

/**
 * Guarda `cloud` si en la nube sigue la revisión `base` (null: no había ninguna) y su sello de intercambios no es más
 * nuevo que el de la subida; false si no (otro dispositivo subió antes o es una partida de antes de un intercambio)
 */
export async function writeSave(db: D1Database, userId: string, cloud: CloudSave, base: number | null): Promise<boolean> {
  const data = JSON.stringify(cloud)
  const stamp = tradeStampOf(cloud)
  const statement =
    base === null
      ? db
          .prepare('INSERT INTO saves (user_id, data, revision, updated_at, trade_stamp) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING')
          .bind(userId, data, cloud.revision, cloud.updatedAt, stamp)
      : db
          .prepare('UPDATE saves SET data = ?, revision = ?, updated_at = ?, trade_stamp = ? WHERE user_id = ? AND revision = ? AND trade_stamp <= ?')
          .bind(data, cloud.revision, cloud.updatedAt, stamp, userId, base, stamp)
  const { meta } = await statement.run()
  return meta.changes === 1
}

/**
 * Guarda la partida cambiada por un intercambio, solo si en la nube sigue la revisión anterior y además se cumple
 * `guard` (una condición SQL sobre las otras tablas, con sus valores): va en el mismo lote que el anuncio
 */
export function tradeSaveStatement(db: D1Database, userId: string, cloud: CloudSave, guard: string, guardValues: (string | number)[]): D1PreparedStatement {
  return db
    .prepare(`UPDATE saves SET data = ?, revision = ?, updated_at = ?, trade_stamp = ? WHERE user_id = ? AND revision = ? AND ${guard}`)
    .bind(JSON.stringify(cloud), cloud.revision, cloud.updatedAt, tradeStampOf(cloud), userId, cloud.revision - 1, ...guardValues)
}
