/**
 * Wallets Routes - API endpoints for wallet operations
 * BE-3: GET /:address/balance - Get wallet balance from DB
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===========================================
// BE-3: GET /:address/balance
// Get wallet balance from DB
// ===========================================
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate wallet address
    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    const result = await pool.query(
      `SELECT address, balance, 
              COALESCE(last_updated, updated_at) as last_updated
       FROM wallets 
       WHERE address = $1`,
      [address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    const wallet = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        address: wallet.address,
        balance: wallet.balance || 0,
        last_updated: wallet.last_updated,
      },
    });
  } catch (err) {
    console.error('❌ Error fetching wallet balance:', err);
    return res.status(500).json({
      success: false,
      error: 'Database error while fetching wallet balance',
    });
  }
});

// ===========================================
// Existing Endpoints
// ===========================================

// GET /:address - Get full wallet info
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await pool.query(
      'SELECT * FROM wallets WHERE address = $1',
      [address]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wallet not found' 
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

// POST /:address/connect - Connect/register wallet
router.post('/:address/connect', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address' 
      });
    }

    const result = await pool.query(
      `INSERT INTO wallets (id, address, total_staked, total_winnings, balance, last_updated)
        VALUES ($1, $2, 0, 0, 0, NOW())
        ON CONFLICT (address) DO UPDATE SET updated_at = NOW(), last_updated = NOW()
        RETURNING *`,
      [uuidv4(), address]
    );

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

// PATCH /:address/balance - Update wallet balance
router.patch('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const { balance } = req.body;

    if (balance === undefined || typeof balance !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'balance must be a number',
      });
    }

    const result = await pool.query(
      `UPDATE wallets 
       SET balance = $1, last_updated = NOW(), updated_at = NOW()
       WHERE address = $2
       RETURNING *`,
      [balance, address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
