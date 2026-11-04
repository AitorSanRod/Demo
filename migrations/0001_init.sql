-- Base de datos D1 de Pokérancho: cuentas, sesiones, partidas en la nube y salas compartidas de los jefes.
-- Se aplica con `npm run db:migrate` (remota) o `npm run db:migrate:local`. Un cambio de esquema es un fichero nuevo.

-- Cuentas con email y contraseña (worker/auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  -- pbkdf2-sha256$<iteraciones>$<sal>$<hash>, en base64url
  password_hash TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  nickname TEXT,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  -- Hora (ms) hasta la que no se puede entrar tras demasiados fallos
  locked_until INTEGER NOT NULL DEFAULT 0,
  -- Hora (ms) del último correo mandado, para no mandar más de uno seguido
  last_mail_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Sesiones abiertas: se guarda el hash del token de la cookie, nunca el token
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- Enlaces de los correos (confirmar la cuenta, recuperar la contraseña), de un solo uso
CREATE TABLE auth_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX auth_tokens_user ON auth_tokens (user_id);

-- Partida en la nube de cada cuenta (CloudSave en JSON); revision sube con cada subida aceptada
CREATE TABLE saves (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  revision INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Salas compartidas de los jefes comunitarios (SharedRoom en JSON); version sube con cada escritura
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX rooms_channel ON rooms (channel);
