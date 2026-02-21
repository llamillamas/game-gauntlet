const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/events/:eventId
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/events', async (req, res) => {
  try {
    const {
      game_id,
      organizer_wallet,
      start_time,
      entry_fee,
      max_participants,
    } = req.body;

    if (!game_id || !organizer_wallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventId = uuidv4();
    const result = await pool.query(
      `INSERT INTO events
        (id, game_id, organizer_wallet, status, start_time, entry_fee, max_participants)
        VALUES ($1, $2, $3, 'created', $4, $5, $6)
        RETURNING *`,
      [eventId, game_id, organizer_wallet, start_time, entry_fee, max_participants]
    );

    // TODO: Call Game Registry Program when deployed
    // const programId = process.env.GAME_REGISTRY_PROGRAM_ID;
    // const onChainTx = await solanaClient.createEventOnChain(eventId, organizer_wallet);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:eventId/settle
router.post('/events/:eventId/settle', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { winner, admin_signature } = req.body;

    if (!winner || !admin_signature) {
      return res.status(400).json({ error: 'Missing winner or signature' });
    }

    const result = await pool.query(
      'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['settled', eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // TODO: Call Results Settlement Program when deployed
    // const programId = process.env.RESULTS_SETTLEMENT_PROGRAM_ID;
    // const settleTx = await solanaClient.settleEventOnChain(eventId, winner);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
