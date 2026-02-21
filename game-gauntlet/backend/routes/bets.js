const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/bets/:betId
router.get('/bets/:betId', async (req, res) => {
  try {
    const { betId } = req.params;
    const result = await pool.query(
      'SELECT * FROM bets WHERE id = $1',
      [betId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bets
router.post('/bets', async (req, res) => {
  try {
    const { event_id, bet_type, odds, deadline } = req.body;

    if (!event_id || !bet_type || !odds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const betId = uuidv4();
    const result = await pool.query(
      `INSERT INTO bets
        (id, event_id, bet_type, odds, deadline, status)
        VALUES ($1, $2, $3, $4, $5, 'open')
        RETURNING *`,
      [betId, event_id, bet_type, JSON.stringify(odds), deadline]
    );

    // TODO: Call Betting Pool Program when deployed
    // const programId = process.env.BETTING_POOL_PROGRAM_ID;
    // const poolTx = await solanaClient.createBettingPoolOnChain(betId);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bets/:betId/place
router.post('/bets/:betId/place', async (req, res) => {
  try {
    const { betId } = req.params;
    const { wallet_address, amount, selection, signature } = req.body;

    if (!wallet_address || !amount || !selection) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount < 1) {
      return res.status(400).json({ error: 'Amount must be >= 1' });
    }

    const entryId = uuidv4();
    const result = await pool.query(
      `INSERT INTO bet_entries
        (id, bet_id, wallet_address, amount, selection, status)
        VALUES ($1, $2, $3, $4, $5, 'confirmed')
        RETURNING *`,
      [entryId, betId, wallet_address, amount, selection]
    );

    // TODO: Transfer USDC to escrow via Solana when deployed
    // const usdcMint = process.env.USDC_MINT;
    // const escrowTx = await solanaClient.transferUSDCToEscrow(wallet_address, amount);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
