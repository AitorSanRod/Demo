-- El jefe de la pestaña Raids lo decide el servidor por ciclos (src/game/raid/online/raidCycle.ts): una sola fila.
CREATE TABLE raid_cycle (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  -- RaidCycle en JSON
  data TEXT NOT NULL,
  -- Sube con cada escritura: solo se guarda si nadie lo ha cambiado desde que se leyó
  version INTEGER NOT NULL
);

-- Para listar salas sin abrir su JSON: jugadores con un Pokémon dentro y el resumen que se enseña (RoomSummary)
ALTER TABLE rooms ADD COLUMN players INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN summary TEXT;
CREATE INDEX rooms_players ON rooms (players);

-- Las salas de la pestaña Raids de antes de los ciclos ya no valen: cada jugador vuelve a entrar en el jefe del servidor
DELETE FROM rooms WHERE channel LIKE 'tab/%';
