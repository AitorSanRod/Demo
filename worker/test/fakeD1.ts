import { readFileSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

// D1 para los tests: el SQLite de Node con la misma migración que la base de datos de verdad. Solo lo que usa el
// Worker (prepare, bind, first, all, run, batch).

const MIGRATION = fileURLToPath(new URL('../../migrations/0001_init.sql', import.meta.url).href)

export function fakeD1(): D1Database {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(readFileSync(MIGRATION, 'utf8'))

  const statement = (sql: string, params: SQLInputValue[] = []) => ({
    bind: (...values: SQLInputValue[]) => statement(sql, values),
    first: async (column?: string) => {
      const row = (db.prepare(sql).get(...params) as Record<string, unknown> | undefined) ?? null
      return column ? (row?.[column] ?? null) : row
    },
    all: async () => ({ results: db.prepare(sql).all(...params), success: true, meta: {} }),
    run: async () => ({ success: true, meta: { changes: Number(db.prepare(sql).run(...params).changes) } }),
  })

  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) => {
      const results = []
      for (const s of statements) results.push(await s.run())
      return results
    },
  } as unknown as D1Database
}
