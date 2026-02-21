CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  bet_type VARCHAR NOT NULL,
  odds JSONB,
  deadline TIMESTAMPTZ,
  status VARCHAR DEFAULT 'open',
  on_chain_pool VARCHAR,
  total_pool BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_event_id ON bets(event_id);
CREATE INDEX idx_bets_status ON bets(status);
