CREATE TABLE IF NOT EXISTS bet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  wallet_address VARCHAR NOT NULL,
  amount BIGINT NOT NULL,
  selection VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'confirmed',
  payout BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bet_entries_bet_id ON bet_entries(bet_id);
CREATE INDEX idx_bet_entries_wallet ON bet_entries(wallet_address);
