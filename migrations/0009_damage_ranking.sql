-- Ranking de daño a los jefes comunitarios (worker/db/damageRanking.ts). Cuenta desde que se creó esta tabla.

-- Daño total de cada Pokémon de cada cuenta; se suma al terminar cada pelea (cae el jefe o se escapa)
CREATE TABLE raid_damage (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  uid TEXT NOT NULL,
  species_id INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  PRIMARY KEY (user_id, uid)
);

-- Puesto de cada cuenta en la última foto (la rehace cada hora la tarea programada, con la del dinero)
CREATE TABLE damage_ranking (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  species_id INTEGER NOT NULL,
  mon_damage INTEGER NOT NULL
);
CREATE INDEX damage_ranking_rank ON damage_ranking (rank);
