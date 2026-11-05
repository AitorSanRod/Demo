-- Las salas con el jefe ya caído o escapado seguían contando sus jugadores y salían en la lista de jefes de ruta
-- como «1 jugador». Desde ahora se guardan con 0 (worker/db/rooms.ts); esto arregla las que ya estaban guardadas.
UPDATE rooms SET players = 0 WHERE json_extract(data, '$.raid.hp') = 0 OR json_extract(data, '$.closed') = 1;
