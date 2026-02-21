/**
 * Bets Routes - API endpoints for bet operations
 * BE-1: GET /user/:walletAddress - Fetch user's all bets
 * BE-2: POST /settle - Mark bet as settled + calculate payout
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===========================================
// BE-1: GET /user/:walletAddress
// Fetch user's all bets (placed + settled)
// ===========================================
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Validate wallet address
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    // Query bets for user - check both direct bets and bet_entries
    const result = await pool.query(
      `SELECT 
        b.id,
        b.event_id,
        COALESCE(b.amount, be.amount) as amount,
        b.odds,
        b.status,
        b.payout_amount,
        COALESCE(b.created_at, be.created_at) as created_at
      FROM bets b
      LEFT JOIN bet_entries be ON be.bet_id = b.id AND be.wallet_address = $1
      WHERE b.wallet_address = $1 OR be.wallet_address = $1
      ORDER BY COALESCE(b.created_at, be.created_at) DESC`,
      [walletAddress]
    );

    // Return empty array if no bets found (not 404 - user exists but has no bets)
    return res.status(200).json({
      success: true,
      data: {
        bets: result.rows.map(row => ({
          id: row.id,
          event_id: row.event_id,
          amount: row.amount,
          odds: row.odds,
          status: row.status,
          payout_amount: row.payout_amount,
          created_at: row.created_at,
        })),
      },
    });
  } catch (err) {
    console.error('❌ Error fetching user bets:', err);
    return res.status(500).json({
      success: false,
      error: 'Database error while fetching bets',
    });
  }
});

// ===========================================
// BE-2: POST /settle
// Mark bet as settled + calculate payout
// ===========================================
router.post('/settle', async (req, res) => {
  try {
    const { bet_id, settled_at, result_index, payout_amount } = req.body;

    // Validate required fields
    if (!bet_id) {
      return res.status(400).json({
        success: false,
        error: 'bet_id is required',
      });
    }

    if (result_index === undefined || result_index === null) {
      return res.status(400).json({
        success: false,
        error: 'result_index is required',
      });
    }

    if (payout_amount === undefined || payout_amount === null) {
      return res.status(400).json({
        success: false,
        error: 'payout_amount is required',
      });
    }

    if (typeof payout_amount !== 'number' || payout_amount < 0) {
      return res.status(400).json({
        success: false,
        error: 'payout_amount must be a non-negative number',
      });
    }

    // Check if bet exists and is in 'open' status
    const existingBet = await pool.query(
      'SELECT * FROM bets WHERE id = $1',
      [bet_id]
    );

    if (existingBet.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found',
      });
    }

    if (existingBet.rows[0].status !== 'open') {
      return res.status(400).json({
        success: false,
        error: `Bet cannot be settled - current status is '${existingBet.rows[0].status}'`,
      });
    }

    // Generate mock tx_hash (real Solana integration in Phase 4)
    const tx_hash = `mock_tx_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const settlementTime = settled_at ? new Date(settled_at) : new Date();

    // Update bet to settled status
    const updateResult = await pool.query(
      `UPDATE bets 
       SET status = 'settled',
           payout_amount = $1,
           settled_at = $2,
           result_index = $3,
           tx_hash = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [payout_amount, settlementTime, result_index, tx_hash, bet_id]
    );

    // Also update any bet_entries for this bet
    await pool.query(
      `UPDATE bet_entries 
       SET payout = $1,
           settled_at = $2,
           result_index = $3
       WHERE bet_id = $4`,
      [payout_amount, settlementTime, result_index, bet_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        payout_amount: updateResult.rows[0].payout_amount,
        tx_hash: tx_hash,
      },
    });
  } catch (err) {
    console.error('❌ Error settling bet:', err);
    return res.status(500).json({
      success: false,
      error: 'Database error while settling bet',
    });
  }
});

// ===========================================
// Existing Endpoints
// ===========================================

// GET /:betId - Get single bet by ID
router.get('/:betId', async (req, res) => {
  try {
    const { betId } = req.params;
    const result = await pool.query(
      'SELECT * FROM bets WHERE id = $1',
      [betId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bet not found' 
      });
    }
    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// POST / - Create new bet
router.post('/', async (req, res) => {
  try {
    const { event_id, bet_type, odds, deadline, wallet_address, amount } = req.body;

    if (!event_id || !bet_type || !odds) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const betId = uuidv4();
    const result = await pool.query(
      `INSERT INTO bets
        (id, event_id, bet_type, odds, deadline, status, wallet_address, amount)
        VALUES ($1, $2, $3, $4, $5, 'open', $6, $7)
        RETURNING *`,
      [betId, event_id, bet_type, JSON.stringify(odds), deadline, wallet_address, amount]
    );

    // TODO: Call Betting Pool Program when deployed
    // const programId = process.env.BETTING_POOL_PROGRAM_ID;
    // const poolTx = await solanaClient.createBettingPoolOnChain(betId);

    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// POST /:betId/place - Place bet entry
router.post('/:betId/place', async (req, res) => {
  try {
    const { betId } = req.params;
    const { wallet_address, amount, selection, signature } = req.body;

    if (!wallet_address || !amount || !selection) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    if (amount < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be >= 1' 
      });
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

    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

module.exports = router;
