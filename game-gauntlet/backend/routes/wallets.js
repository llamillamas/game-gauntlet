const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/wallets/:address
router.get('/wallets/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await pool.query(
      'SELECT * FROM wallets WHERE address = $1',
      [address]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wallets/:address/connect
router.post('/wallets/:address/connect', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const result = await pool.query(
      `INSERT INTO wallets (id, address, total_staked, total_winnings)
        VALUES ($1, $2, 0, 0)
        ON CONFLICT (address) DO UPDATE SET updated_at = NOW()
        RETURNING *`,
      [uuidv4(), address]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
