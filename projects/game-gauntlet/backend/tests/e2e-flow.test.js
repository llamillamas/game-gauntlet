/**
 * E2E Integration Test: Game Gauntlet Flow
 * Tests the full flow: Event → Bet → Place → Settle
 * Database and API integration validation
 */

const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Game Gauntlet E2E Flow', () => {
  let eventId, betId, betEntryId, walletAddress;

  // Setup: Create test wallets and clean up before tests
  beforeAll(async () => {
    walletAddress = '9B5X4mhgKYzTV3n7mK5pQjVRD8nV2q9LwX3zP6kH4u2Y';
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await pool.query('DELETE FROM bet_entries');
    await pool.query('DELETE FROM bets');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM wallets WHERE address = $1', [walletAddress]);
    await pool.end();
  });

  // ==========================================
  // STEP 1: Create Event
  // ==========================================
  describe('Step 1: Create Event', () => {
    it('should create a new event', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          game_id: 'mario-kart-tournament-1',
          organizer_wallet: '5yNmZBX2FUxmzR5c8rVVfHXTqKxkr9jJMEzPp5TqFQ5X',
          start_time: '2026-02-25T18:00:00Z',
          entry_fee: 10,
          max_participants: 16,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.game_id).toBe('mario-kart-tournament-1');
      expect(response.body.status).toBe('created');

      eventId = response.body.id;
    });

    it('should reject event creation with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          game_id: 'test-game',
          // missing organizer_wallet
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should retrieve created event', async () => {
      const response = await request(app)
        .get(`/api/v1/events/${eventId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(eventId);
      expect(response.body.game_id).toBe('mario-kart-tournament-1');
    });
  });

  // ==========================================
  // STEP 2: Create Betting Pool
  // ==========================================
  describe('Step 2: Create Betting Pool', () => {
    it('should create a new betting pool', async () => {
      const response = await request(app)
        .post('/api/v1/bets')
        .send({
          event_id: eventId,
          bet_type: 'winner',
          odds: {
            player1: 1.5,
            player2: 2.5,
            player3: 3.0,
          },
          deadline: '2026-02-25T17:55:00Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.event_id).toBe(eventId);
      expect(response.body.status).toBe('open');
      expect(response.body.bet_type).toBe('winner');

      betId = response.body.id;
    });

    it('should reject bet creation with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/bets')
        .send({
          event_id: eventId,
          // missing bet_type and odds
        });

      expect(response.status).toBe(400);
    });

    it('should retrieve created bet', async () => {
      const response = await request(app)
        .get(`/api/v1/bets/${betId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(betId);
      expect(response.body.status).toBe('open');
    });
  });

  // ==========================================
  // STEP 3: Connect Wallet
  // ==========================================
  describe('Step 3: Connect Wallet', () => {
    it('should connect a new wallet', async () => {
      const response = await request(app)
        .post(`/api/v1/wallets/${walletAddress}/connect`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.address).toBe(walletAddress);
      expect(response.body.total_staked).toBe(0);
      expect(response.body.total_winnings).toBe(0);
    });

    it('should retrieve wallet stats', async () => {
      const response = await request(app)
        .get(`/api/v1/wallets/${walletAddress}`);

      expect(response.status).toBe(200);
      expect(response.body.address).toBe(walletAddress);
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/wallets/invalid/connect')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // ==========================================
  // STEP 4: Place Bet
  // ==========================================
  describe('Step 4: Place Bet', () => {
    it('should place a bet on the open pool', async () => {
      const response = await request(app)
        .post(`/api/v1/bets/${betId}/place`)
        .send({
          wallet_address: walletAddress,
          amount: 50,
          selection: 'player1',
          signature: 'mock-solana-signature-123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.bet_id).toBe(betId);
      expect(response.body.wallet_address).toBe(walletAddress);
      expect(response.body.amount).toBe(50);
      expect(response.body.selection).toBe('player1');
      expect(response.body.status).toBe('confirmed');

      betEntryId = response.body.id;
    });

    it('should reject bet placement with invalid amount', async () => {
      const response = await request(app)
        .post(`/api/v1/bets/${betId}/place`)
        .send({
          wallet_address: walletAddress,
          amount: 0, // Invalid
          selection: 'player1',
          signature: 'sig',
        });

      expect(response.status).toBe(400);
    });

    it('should reject bet placement with missing fields', async () => {
      const response = await request(app)
        .post(`/api/v1/bets/${betId}/place`)
        .send({
          wallet_address: walletAddress,
          // missing amount and selection
        });

      expect(response.status).toBe(400);
    });

    it('should allow multiple bets on same pool', async () => {
      const wallet2 = '5yNmZBX2FUxmzR5c8rVVfHXTqKxkr9jJMEzPp5TqFQ5A';
      
      const response = await request(app)
        .post(`/api/v1/bets/${betId}/place`)
        .send({
          wallet_address: wallet2,
          amount: 25,
          selection: 'player2',
          signature: 'sig2',
        });

      expect(response.status).toBe(201);
      expect(response.body.wallet_address).toBe(wallet2);
      expect(response.body.selection).toBe('player2');
    });
  });

  // ==========================================
  // STEP 5: Settle Event
  // ==========================================
  describe('Step 5: Settle Event', () => {
    it('should settle the event with a winner', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${eventId}/settle`)
        .send({
          winner: 'player1',
          admin_signature: 'mock-admin-sig-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(eventId);
      expect(response.body.status).toBe('settled');
    });

    it('should reject settlement with missing fields', async () => {
      // Create another event to test this
      const createRes = await request(app)
        .post('/api/v1/events')
        .send({
          game_id: 'test-settle',
          organizer_wallet: '5yNmZBX2FUxmzR5c8rVVfHXTqKxkr9jJMEzPp5TqFQ5X',
        });

      const testEventId = createRes.body.id;

      const response = await request(app)
        .post(`/api/v1/events/${testEventId}/settle`)
        .send({
          winner: 'player1',
          // missing admin_signature
        });

      expect(response.status).toBe(400);
    });

    it('should not settle non-existent event', async () => {
      const response = await request(app)
        .post('/api/v1/events/non-existent-id/settle')
        .send({
          winner: 'player1',
          admin_signature: 'sig',
        });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // Database Integrity Checks
  // ==========================================
  describe('Database Integrity', () => {
    it('should have persisted event data correctly', async () => {
      const result = await pool.query(
        'SELECT * FROM events WHERE id = $1',
        [eventId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].game_id).toBe('mario-kart-tournament-1');
      expect(result.rows[0].status).toBe('settled');
    });

    it('should have persisted bet data correctly', async () => {
      const result = await pool.query(
        'SELECT * FROM bets WHERE id = $1',
        [betId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].event_id).toBe(eventId);
      expect(result.rows[0].status).toBe('open'); // Bets don't auto-settle
    });

    it('should have persisted bet entries correctly', async () => {
      const result = await pool.query(
        'SELECT * FROM bet_entries WHERE id = $1',
        [betEntryId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].bet_id).toBe(betId);
      expect(result.rows[0].amount).toBe(50);
    });

    it('should have persisted wallet data correctly', async () => {
      const result = await pool.query(
        'SELECT * FROM wallets WHERE address = $1',
        [walletAddress]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].address).toBe(walletAddress);
    });

    it('should have correct foreign key relationships', async () => {
      const result = await pool.query(
        `SELECT b.id, b.event_id, e.id as event_exists
         FROM bets b
         LEFT JOIN events e ON b.event_id = e.id
         WHERE b.id = $1`,
        [betId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].event_exists).toBe(eventId);
    });
  });

  // ==========================================
  // Error Handling
  // ==========================================
  describe('Error Handling', () => {
    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/non-existent-uuid');

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent bet', async () => {
      const response = await request(app)
        .get('/api/v1/bets/non-existent-uuid');

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await request(app)
        .get('/api/v1/wallets/NonExistentAddress123');

      expect(response.status).toBe(404);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('game-gauntlet-api');
  });
});
