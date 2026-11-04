import type { CloudSave } from '../../src/game/core/cloudSave'

// Partidas en la nube en D1 (tabla saves): una por cuenta. Subir solo vale encima de la revisión que el dispositivo
// vio por última vez; la comprobación va en la misma consulta, así dos subidas a la vez no se pisan.

interface SaveRow {
  data: string
}

export async function loadSave(db: D1Database, userId: string): Promise<CloudSave | null> {
  const row = await db.prepare('SELECT data FROM saves WHERE user_id = ?').bind(userId).first<SaveRow>()
  return row && (JSON.parse(row.data) as CloudSave)
}

/** Guarda `cloud` si en la nube sigue la revisión `base` (null: no había ninguna); false si otro dispositivo subió antes */
export async function writeSave(db: D1Database, userId: string, cloud: CloudSave, base: number | null): Promise<boolean> {
  const data = JSON.stringify(cloud)
  const statement =
    base === null
      ? db
          .prepare('INSERT INTO saves (user_id, data, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING')
          .bind(userId, data, cloud.revision, cloud.updatedAt)
      : db
          .prepare('UPDATE saves SET data = ?, revision = ?, updated_at = ? WHERE user_id = ? AND revision = ?')
          .bind(data, cloud.revision, cloud.updatedAt, userId, base)
  const { meta } = await statement.run()
  return meta.changes === 1
}
