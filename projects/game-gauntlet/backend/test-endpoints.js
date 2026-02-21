/**
 * Quick E2E Test Script for Page Redesign Endpoints
 * Run with: node -r dotenv/config test-endpoints.js
 */

const http = require('http');
const app = require('./src/app');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let server;
let eventId, betId;
const walletAddress = '7P9Y8mhgKYzTV3n7mK5pQjVRD8nV2q9LwX3zP6kH8f3Z';
const PORT = 3999;

async function setupTestData() {
  console.log('📦 Setting up test data...');
  
  // Ensure schema has required columns
  try {
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS wallet_address VARCHAR`);
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS amount BIGINT`);
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS payout_amount BIGINT DEFAULT 0`);
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS result_index INT`);
    await pool.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS tx_hash VARCHAR`);
    await pool.query(`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0`);
    await pool.query(`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW()`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS odds_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        outcome_index INT NOT NULL,
        odds DECIMAL(10, 4) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (e) {
    // ignore
  }

  // Create event
  const eventResult = await pool.query(
    `INSERT INTO events (id, game_id, organizer_wallet, status)
     VALUES (gen_random_uuid(), 'test-game', 'organizer123456789012345678901234', 'created')
     RETURNING id`
  );
  eventId = eventResult.rows[0].id;

  // Create wallet
  await pool.query(
    `INSERT INTO wallets (id, address, balance, last_updated)
     VALUES (gen_random_uuid(), $1, 5000, NOW())
     ON CONFLICT (address) DO UPDATE SET balance = 5000, last_updated = NOW()`,
    [walletAddress]
  );

  // Create bet
  const betResult = await pool.query(
    `INSERT INTO bets (id, event_id, bet_type, odds, status, wallet_address, amount)
     VALUES (gen_random_uuid(), $1, 'winner', '{"team1": 1.5, "team2": 2.0}', 'open', $2, 100)
     RETURNING id`,
    [eventId, walletAddress]
  );
  betId = betResult.rows[0].id;
  
  console.log('✅ Test data created');
  console.log(`   Event ID: ${eventId}`);
  console.log(`   Bet ID: ${betId}`);
  console.log(`   Wallet: ${walletAddress}`);
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  await pool.query('DELETE FROM odds_updates WHERE event_id = $1', [eventId]);
  await pool.query('DELETE FROM bet_entries WHERE bet_id = $1', [betId]);
  await pool.query('DELETE FROM bets WHERE id = $1', [betId]);
  await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
  await pool.query('DELETE FROM wallets WHERE address = $1', [walletAddress]);
  console.log('✅ Cleanup complete');
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const test = (name, condition) => {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  };

  // BE-1: GET /api/v1/bets/user/:walletAddress
  console.log('\n📋 BE-1: GET /api/v1/bets/user/:walletAddress');
  const be1 = await request('GET', `/api/v1/bets/user/${walletAddress}`);
  test('Returns 200', be1.status === 200);
  test('Response has success: true', be1.body.success === true);
  test('Response has bets array', Array.isArray(be1.body.data?.bets));
  test('Bets array contains data', be1.body.data?.bets?.length > 0);

  // BE-2: POST /api/v1/bets/settle
  console.log('\n📋 BE-2: POST /api/v1/bets/settle');
  
  // Create fresh bet for settlement
  const settleBetResult = await pool.query(
    `INSERT INTO bets (id, event_id, bet_type, odds, status, wallet_address, amount)
     VALUES (gen_random_uuid(), $1, 'winner', '{"team1": 1.5}', 'open', $2, 50)
     RETURNING id`,
    [eventId, walletAddress]
  );
  const settleBetId = settleBetResult.rows[0].id;

  const be2 = await request('POST', '/api/v1/bets/settle', {
    bet_id: settleBetId,
    result_index: 0,
    payout_amount: 75,
  });
  test('Returns 200', be2.status === 200);
  test('Response has success: true', be2.body.success === true);
  test('Response has payout_amount', Number(be2.body.data?.payout_amount) === 75);
  test('Response has tx_hash', be2.body.data?.tx_hash?.startsWith('mock_tx_'));

  // Cleanup settle bet
  await pool.query('DELETE FROM bets WHERE id = $1', [settleBetId]);

  // BE-3: GET /api/v1/wallets/:address/balance
  console.log('\n📋 BE-3: GET /api/v1/wallets/:address/balance');
  const be3 = await request('GET', `/api/v1/wallets/${walletAddress}/balance`);
  test('Returns 200', be3.status === 200);
  test('Response has success: true', be3.body.success === true);
  test('Response has address', be3.body.data?.address === walletAddress);
  test('Response has balance', Number(be3.body.data?.balance) === 5000);
  test('Response has last_updated', be3.body.data?.last_updated !== undefined);

  // BE-4: POST /api/v1/events/:eventId/odds
  console.log('\n📋 BE-4: POST /api/v1/events/:eventId/odds');
  const be4 = await request('POST', `/api/v1/events/${eventId}/odds`, {
    outcome_index: 0,
    new_odds: 1.85,
    timestamp: new Date().toISOString(),
  });
  test('Returns 200', be4.status === 200);
  test('Response has success: true', be4.body.success === true);
  test('Response has event_id', be4.body.data?.event_id === eventId);
  test('Response has outcome', be4.body.data?.outcome === 0);
  test('Response has new_odds', Math.abs(be4.body.data?.new_odds - 1.85) < 0.01);
  test('Response has updated_at', be4.body.data?.updated_at !== undefined);

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  return { passed, failed };
}

async function main() {
  try {
    console.log('🚀 Starting E2E tests for Page Redesign endpoints...\n');
    
    // Start server
    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
    // Setup and run tests
    await setupTestData();
    const results = await runTests();
    await cleanupTestData();
    
    // Close connections
    server.close();
    await pool.end();
    
    // Exit
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test error:', error);
    if (server) server.close();
    await pool.end();
    process.exit(1);
  }
}

main();
