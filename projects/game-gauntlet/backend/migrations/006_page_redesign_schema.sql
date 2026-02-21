-- Migration 006: Page Redesign Schema Updates
-- Adds columns and tables for BE-1 through BE-4 endpoints

-- Add settlement columns to bet_entries
ALTER TABLE bet_entries 
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS result_index INT,
ADD COLUMN IF NOT EXISTS payout_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR;

-- Add wallet_address to bets for direct bet tracking
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR,
ADD COLUMN IF NOT EXISTS amount BIGINT,
ADD COLUMN IF NOT EXISTS payout_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS result_index INT,
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR;

CREATE INDEX IF NOT EXISTS idx_bets_wallet_address ON bets(wallet_address);

-- Add balance column to wallets
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Create odds_updates table for live odds tracking
CREATE TABLE IF NOT EXISTS odds_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  outcome_index INT NOT NULL,
  odds DECIMAL(10, 4) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odds_updates_event_id ON odds_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_updates_timestamp ON odds_updates(timestamp);
