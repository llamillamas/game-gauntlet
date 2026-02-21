CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR NOT NULL UNIQUE,
  total_staked BIGINT DEFAULT 0,
  total_winnings BIGINT DEFAULT 0,
  total_losses BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_address ON wallets(address);
