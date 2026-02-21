/**
 * E2E Tests: Page Redesign Backend Endpoints
 * Tests BE-1 through BE-4 endpoints
 * 
 * BE-1: GET /api/v1/bets/user/:walletAddress
 * BE-2: POST /api/v1/bets/settle
 * BE-3: GET /api/v1/wallets/:address/balance
 * BE-4: POST /api/v1/events/:eventId/odds
 */

const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Page Redesign Backend Endpoints (BE-1 to BE-4)', () => {
  let eventId, betId, walletAddress;

  // Setup: Create test data before tests
  beforeAll(async () => {
    walletAddress = '7P9Y8mhgKYzTV3n7mK5pQjVRD8nV2q9LwX3zP6kH8f3Z';

    // Run migration to ensure schema is up to date
    try {
      await pool.query(`
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS wallet_address VARCHAR;
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS amount BIGINT;
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS payout_amount BIGINT DEFAULT 0;
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS result_index INT;
        ALTER TABLE bets ADD COLUMN IF NOT EXISTS tx_hash VARCHAR;
        
        ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0;
        ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();
        
        CREATE TABLE IF NOT EXISTS odds_updates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          outcome_index INT NOT NULL,
          odds DECIMAL(10, 4) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch (err) {
      // Schema might already exist, that's fine
      console.log('Schema setup note:', err.message);
    }

    // Create test event
    const eventResult = await pool.query(
      `INSERT INTO events (id, game_id, organizer_wallet, status)
       VALUES (gen_random_uuid(), 'test-game', 'organizer123456789012345678901234', 'created')
       RETURNING id`
    );
    eventId = eventResult.rows[0].id;

    // Create test wallet with balance
    await pool.query(
      `INSERT INTO wallets (id, address, balance, last_updated)
       VALUES (gen_random_uuid(), $1, 5000, NOW())
       ON CONFLICT (address) DO UPDATE SET balance = 5000, last_updated = NOW()`,
      [walletAddress]
    );

    // Create test bet
    const betResult = await pool.query(
      `INSERT INTO bets (id, event_id, bet_type, odds, status, wallet_address, amount)
       VALUES (gen_random_uuid(), $1, 'winner', '{"team1": 1.5, "team2": 2.0}', 'open', $2, 100)
       RETURNING id`,
      [eventId, walletAddress]
    );
    betId = betResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM odds_updates WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM bet_entries WHERE bet_id = $1', [betId]);
    await pool.query('DELETE FROM bets WHERE id = $1', [betId]);
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    await pool.query('DELETE FROM wallets WHERE address = $1', [walletAddress]);
    await pool.end();
  });

  // ==========================================
  // BE-1: GET /api/v1/bets/user/:walletAddress
  // ==========================================
  describe('BE-1: GET /api/v1/bets/user/:walletAddress', () => {
    it('should fetch user bets successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/bets/user/${walletAddress}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bets');
      expect(Array.isArray(response.body.data.bets)).toBe(true);
      expect(response.body.data.bets.length).toBeGreaterThan(0);
      
      const bet = response.body.data.bets[0];
      expect(bet).toHaveProperty('id');
      expect(bet).toHaveProperty('event_id');
      expect(bet).toHaveProperty('status');
      expect(bet).toHaveProperty('created_at');
    });

    it('should return empty array for wallet with no bets', async () => {
      const emptyWallet = 'EmptyWallet12345678901234567890123456';
      const response = await request(app)
        .get(`/api/v1/bets/user/${emptyWallet}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bets).toEqual([]);
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/v1/bets/user/short');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // ==========================================
  // BE-2: POST /api/v1/bets/settle
  // ==========================================
  describe('BE-2: POST /api/v1/bets/settle', () => {
    let settleBetId;

    beforeAll(async () => {
      // Create a fresh bet for settlement test
      const betResult = await pool.query(
        `INSERT INTO bets (id, event_id, bet_type, odds, status, wallet_address, amount)
         VALUES (gen_random_uuid(), $1, 'winner', '{"team1": 1.5}', 'open', $2, 50)
         RETURNING id`,
        [eventId, walletAddress]
      );
      settleBetId = betResult.rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM bets WHERE id = $1', [settleBetId]);
    });

    it('should settle bet successfully', async () => {
      const response = await request(app)
        .post('/api/v1/bets/settle')
        .send({
          bet_id: settleBetId,
          settled_at: new Date().toISOString(),
          result_index: 0,
          payout_amount: 75,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payout_amount');
      expect(Number(response.body.data.payout_amount)).toBe(75);
      expect(response.body.data).toHaveProperty('tx_hash');
      expect(response.body.data.tx_hash).toMatch(/^mock_tx_/);
    });

    it('should reject settlement for non-existent bet', async () => {
      const response = await request(app)
        .post('/api/v1/bets/settle')
        .send({
          bet_id: '00000000-0000-0000-0000-000000000000',
          result_index: 0,
          payout_amount: 50,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should reject settlement for already settled bet', async () => {
      const response = await request(app)
        .post('/api/v1/bets/settle')
        .send({
          bet_id: settleBetId,
          result_index: 1,
          payout_amount: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('settled');
    });

    it('should reject settlement with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/bets/settle')
        .send({
          bet_id: settleBetId,
          // missing result_index and payout_amount
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // BE-3: GET /api/v1/wallets/:address/balance
  // ==========================================
  describe('BE-3: GET /api/v1/wallets/:address/balance', () => {
    it('should fetch wallet balance successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/wallets/${walletAddress}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('address');
      expect(response.body.data.address).toBe(walletAddress);
      expect(response.body.data).toHaveProperty('balance');
      expect(Number(response.body.data.balance)).toBe(5000);
      expect(response.body.data).toHaveProperty('last_updated');
    });

    it('should return 404 for non-existent wallet', async () => {
      const nonExistent = 'NonExistent12345678901234567890123';
      const response = await request(app)
        .get(`/api/v1/wallets/${nonExistent}/balance`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should reject invalid wallet address format', async () => {
      const response = await request(app)
        .get('/api/v1/wallets/x/balance');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // BE-4: POST /api/v1/events/:eventId/odds
  // ==========================================
  describe('BE-4: POST /api/v1/events/:eventId/odds', () => {
    it('should update odds successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${eventId}/odds`)
        .send({
          outcome_index: 0,
          new_odds: 1.85,
          timestamp: new Date().toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('event_id');
      expect(response.body.data.event_id).toBe(eventId);
      expect(response.body.data).toHaveProperty('outcome');
      expect(response.body.data.outcome).toBe(0);
      expect(response.body.data).toHaveProperty('new_odds');
      expect(response.body.data.new_odds).toBeCloseTo(1.85, 2);
      expect(response.body.data).toHaveProperty('updated_at');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .post('/api/v1/events/00000000-0000-0000-0000-000000000000/odds')
        .send({
          outcome_index: 0,
          new_odds: 2.0,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should reject invalid odds value', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${eventId}/odds`)
        .send({
          outcome_index: 0,
          new_odds: -1.5, // Invalid negative odds
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('positive');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${eventId}/odds`)
        .send({
          outcome_index: 0,
          // missing new_odds
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
