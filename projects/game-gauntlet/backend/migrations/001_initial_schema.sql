-- Game Gauntlet Database Schema v1.0
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- GAMES TABLE
-- Stores game metadata and NFT ownership info
-- =============================================
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_address VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  github_url VARCHAR(500) UNIQUE,
  preview_image_url VARCHAR(500),
  nft_mint VARCHAR(255) UNIQUE,
  transaction_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
  play_count INT DEFAULT 0,
  total_earnings BIGINT DEFAULT 0,
  avg_bet BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_games_creator ON games(creator_address);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_earnings ON games(total_earnings DESC);
CREATE INDEX idx_games_created ON games(created_at DESC);

-- =============================================
-- PARTIES TABLE
-- Bet parties with game selection and players
-- =============================================
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_address VARCHAR(255) NOT NULL,
  games JSONB NOT NULL DEFAULT '[]',
  players JSONB NOT NULL DEFAULT '[]',
  bet_amount BIGINT NOT NULL CHECK (bet_amount > 0),
  total_pot BIGINT DEFAULT 0,
  min_players INT DEFAULT 2,
  max_players INT DEFAULT 10,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'playing', 'settling', 'settled', 'cancelled')),
  winner_address VARCHAR(255),
  party_url VARCHAR(255),
  solana_account VARCHAR(255),
  lock_transaction_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookups
CREATE INDEX idx_parties_creator ON parties(creator_address);
CREATE INDEX idx_parties_status ON parties(status);
CREATE INDEX idx_parties_created ON parties(created_at DESC);

-- =============================================
-- RESULTS TABLE
-- Settlement records for completed games
-- =============================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  winner_address VARCHAR(255) NOT NULL,
  game_state_hash VARCHAR(255),
  total_pot_settled BIGINT NOT NULL,
  platform_fee BIGINT DEFAULT 0,
  creator_fee BIGINT DEFAULT 0,
  winner_payout BIGINT NOT NULL,
  settlement_signature VARCHAR(255),
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_results_party ON results(party_id);
CREATE INDEX idx_results_winner ON results(winner_address);
CREATE INDEX idx_results_created ON results(created_at DESC);

-- =============================================
-- USERS TABLE
-- Player profiles and stats
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  wallet_address VARCHAR(255) PRIMARY KEY,
  profile_name VARCHAR(255),
  avatar_url VARCHAR(500),
  total_earnings BIGINT DEFAULT 0,
  total_bets BIGINT DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  win_count INT DEFAULT 0,
  loss_count INT DEFAULT 0,
  games_played INT DEFAULT 0,
  favorite_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX idx_users_earnings ON users(total_earnings DESC);
CREATE INDEX idx_users_wins ON users(win_count DESC);

-- =============================================
-- TRANSACTIONS TABLE
-- Track all blockchain transactions
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet', 'payout', 'fee', 'nft_mint')),
  amount BIGINT NOT NULL,
  token_mint VARCHAR(255),
  transaction_hash VARCHAR(255) UNIQUE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA (for development)
-- =============================================

-- Insert sample games (commented out for production)
-- INSERT INTO games (creator_address, title, description, github_url, status) VALUES
-- ('DemoWallet123...', 'Space Invaders', 'Classic arcade shooter', 'https://github.com/demo/space-invaders', 'active'),
-- ('DemoWallet123...', 'Pong Masters', '2-player pong with power-ups', 'https://github.com/demo/pong-masters', 'active');

COMMENT ON TABLE games IS 'Game NFTs with metadata and play statistics';
COMMENT ON TABLE parties IS 'Bet parties with player deposits and game selections';
COMMENT ON TABLE results IS 'Settlement records linking parties to winners';
COMMENT ON TABLE users IS 'Player profiles with earnings and statistics';
COMMENT ON TABLE transactions IS 'Blockchain transaction history';
