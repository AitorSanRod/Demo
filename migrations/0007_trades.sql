-- Intercambios entre jugadores (worker/trade.ts): anuncios, lo pendiente de recoger y el sello de intercambios de cada
-- partida en la nube.

-- Sello de intercambios de la partida (GameState.tradeStamp): no se acepta subir una partida con uno más viejo
ALTER TABLE saves ADD COLUMN trade_stamp INTEGER NOT NULL DEFAULT 0;

-- Anuncios. offer y ask en JSON (TradeGood y TradeAsk); offer_species, la especie de lo ofrecido, para buscar.
-- status: open, sold, expired o withdrawn
CREATE TABLE trade_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  offer TEXT NOT NULL,
  offer_species INTEGER,
  ask TEXT NOT NULL,
  status TEXT NOT NULL,
  buyer_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  closed_at INTEGER
);
CREATE INDEX trade_listings_status ON trade_listings (status, expires_at);
CREATE INDEX trade_listings_seller ON trade_listings (seller_id, status);

-- Lo que se le debe a cada cuenta (TradeGood en JSON) hasta que lo recoge en Notificaciones. reason: InboxReason
CREATE TABLE trade_inbox (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  good TEXT NOT NULL,
  reason TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  claimed_at INTEGER
);
CREATE INDEX trade_inbox_user ON trade_inbox (user_id, claimed_at);
