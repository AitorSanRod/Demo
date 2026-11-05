-- Obsequio diario de cada cuenta (src/game/collection/dailyGift.ts): cuántos lleva recogidos y cuándo fue el último
CREATE TABLE daily_gifts (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  claimed INTEGER NOT NULL,
  last_claim_at INTEGER NOT NULL
);
