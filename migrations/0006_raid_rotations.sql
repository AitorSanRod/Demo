-- Dos rotaciones de jefes a la vez en la pestaña Raids (src/game/raid/online/raidCycle.ts): una fila por rotación.
CREATE TABLE raid_cycles (
  -- RaidRotation: 'ordered' o 'random'
  rotation TEXT PRIMARY KEY,
  -- RaidCycle en JSON
  data TEXT NOT NULL,
  -- Sube con cada escritura: solo se guarda si nadie lo ha cambiado desde que se leyó
  version INTEGER NOT NULL
);

-- El ciclo de antes sigue como rotación ordenada; su jefe era el número de ciclo (se lee con módulo de RAID_BOSSES)
INSERT INTO raid_cycles (rotation, data, version)
SELECT
  'ordered',
  json_set(
    data,
    '$.rotation', 'ordered',
    '$.bossIndex', json_extract(data, '$.number'),
    '$.nextBossIndex', json_extract(data, '$.number') + 1
  ),
  version
FROM raid_cycle;

DROP TABLE raid_cycle;

-- Sus salas pasan a la carpeta de la rotación ordenada (el id de cada sala no cambia)
UPDATE rooms
SET channel = 'tab/ordered/' || substr(channel, 5), data = json_set(data, '$.channel.rotation', 'ordered')
WHERE channel LIKE 'tab/%';
