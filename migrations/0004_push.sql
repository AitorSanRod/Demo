-- Notificaciones push (worker/push): a qué navegadores se puede avisar y qué avisos hay programados.

-- Una por navegador suscrito: su dirección del servicio de push, sus claves de cifrado, de quién es (id de jugador de
-- las raids y, si ha entrado, su cuenta) y qué temas quiere (JSON con PushTopic)
CREATE TABLE push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  player_id TEXT NOT NULL,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  topics TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX push_subscriptions_player ON push_subscriptions (player_id);
CREATE INDEX push_subscriptions_user ON push_subscriptions (user_id);

-- Avisos pendientes; la tarea programada (cron) manda los que ya tocan. Uno por navegador, tema y clave
CREATE TABLE push_jobs (
  endpoint TEXT NOT NULL REFERENCES push_subscriptions (endpoint) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  key TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (endpoint, topic, key)
);
CREATE INDEX push_jobs_due ON push_jobs (due_at);
