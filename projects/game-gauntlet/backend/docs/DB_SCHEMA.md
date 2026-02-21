# Database Schema — Game Gauntlet

**Updated:** Saturday, February 21, 2026 15:04:40 UTC

## Tables

- **events** ✅
- **bets** ✅
- **bet_entries** ✅
- **wallets** ✅
- **games** ✅ (existing)
- **parties** ✅ (existing)

## Migrations Run

1. `002_create_events_table.sql` — Events table with game_id, organizer_wallet, status, timing, and constraints
2. `003_create_bets_table.sql` — Bets table with event_id FK, bet_type, odds (JSONB), status, and pool tracking
3. `004_create_wallets_table.sql` — Wallets table with address (unique), staked/winnings/losses tracking
4. `005_create_bet_entries_table.sql` — Bet entries table with bet_id FK, wallet_address, amount, selection, payout

## Verification Results

- ✅ All 6 expected tables exist
- ✅ Foreign keys set up (events → bets → bet_entries cascade on delete)
- ✅ Indexes created on:
  - `events`: game_id, organizer_wallet
  - `bets`: event_id, status
  - `wallets`: address
  - `bet_entries`: bet_id, wallet_address
- ✅ Migration tracker table created
- ✅ All migrations executed in order

## Schema Integrity

- **Referential Integrity:** bets.event_id → events.id (CASCADE DELETE)
- **Referential Integrity:** bet_entries.bet_id → bets.id (CASCADE DELETE)
- **Uniqueness Constraints:** wallets.address (UNIQUE)
- **Timestamping:** All tables have created_at + updated_at

## Next Steps

- Add application-level constraints if needed
- Consider adding metrics/analytics views
- Set up backup strategy for Neon PostgreSQL
