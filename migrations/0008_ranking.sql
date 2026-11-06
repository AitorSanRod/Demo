-- Ranking de dinero (worker/ranking.ts): una foto que la tarea programada rehace cada hora.

-- La cuenta quiere aparecer en el ranking (Ajustes); si no, tampoco lo ve
ALTER TABLE users ADD COLUMN ranked INTEGER NOT NULL DEFAULT 1;

-- Puesto de cada cuenta que entra (con apodo, visible y con la partida subida hace poco); los empates comparten puesto
CREATE TABLE ranking (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  money INTEGER NOT NULL
);
CREATE INDEX ranking_rank ON ranking (rank);

-- Cuándo (ms) se hizo la última foto: una sola fila
CREATE TABLE ranking_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  built_at INTEGER NOT NULL
);
