CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR NOT NULL,
  organizer_wallet VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'created',
  start_time TIMESTAMPTZ,
  entry_fee BIGINT,
  max_participants INT,
  on_chain_account VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_game_id ON events(game_id);
CREATE INDEX idx_events_organizer ON events(organizer_wallet);
