/**
 * Events Routes - API endpoints for event operations
 * BE-4: POST /:eventId/odds - Update live odds for event
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===========================================
// BE-4: POST /:eventId/odds
// Update live odds for event
// ===========================================
router.post('/:eventId/odds', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { outcome_index, new_odds, timestamp } = req.body;

    // Validate eventId format (UUID)
    if (!eventId || eventId.length < 36) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID format',
      });
    }

    // Validate outcome_index
    if (outcome_index === undefined || outcome_index === null) {
      return res.status(400).json({
        success: false,
        error: 'outcome_index is required',
      });
    }

    if (typeof outcome_index !== 'number' || outcome_index < 0) {
      return res.status(400).json({
        success: false,
        error: 'outcome_index must be a non-negative integer',
      });
    }

    // Validate new_odds
    if (new_odds === undefined || new_odds === null) {
      return res.status(400).json({
        success: false,
        error: 'new_odds is required',
      });
    }

    const oddsValue = parseFloat(new_odds);
    if (isNaN(oddsValue) || oddsValue <= 0) {
      return res.status(400).json({
        success: false,
        error: 'new_odds must be a valid positive decimal number',
      });
    }

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Parse timestamp or use current time
    const oddsTimestamp = timestamp ? new Date(timestamp) : new Date();

    // Insert odds update record
    const insertResult = await pool.query(
      `INSERT INTO odds_updates 
        (id, event_id, outcome_index, odds, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [uuidv4(), eventId, outcome_index, oddsValue, oddsTimestamp]
    );

    const oddsUpdate = insertResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        event_id: oddsUpdate.event_id,
        outcome: oddsUpdate.outcome_index,
        new_odds: parseFloat(oddsUpdate.odds),
        updated_at: oddsUpdate.timestamp,
      },
    });
  } catch (err) {
    console.error('❌ Error updating odds:', err);
    return res.status(500).json({
      success: false,
      error: 'Database error while updating odds',
    });
  }
});

// ===========================================
// GET /:eventId/odds - Get current odds for event
// ===========================================
router.get('/:eventId/odds', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get latest odds for each outcome
    const result = await pool.query(
      `SELECT DISTINCT ON (outcome_index) 
        event_id, outcome_index, odds, timestamp
       FROM odds_updates 
       WHERE event_id = $1
       ORDER BY outcome_index, timestamp DESC`,
      [eventId]
    );

    return res.status(200).json({
      success: true,
      data: {
        event_id: eventId,
        odds: result.rows.map(row => ({
          outcome: row.outcome_index,
          odds: parseFloat(row.odds),
          updated_at: row.timestamp,
        })),
      },
    });
  } catch (err) {
    console.error('❌ Error fetching odds:', err);
    return res.status(500).json({
      success: false,
      error: 'Database error while fetching odds',
    });
  }
});

// ===========================================
// Existing Endpoints
// ===========================================

// GET /:eventId - Get single event by ID
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
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

// POST / - Create new event
router.post('/', async (req, res) => {
  try {
    const {
      game_id,
      organizer_wallet,
      start_time,
      entry_fee,
      max_participants,
    } = req.body;

    if (!game_id || !organizer_wallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
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

// POST /:eventId/settle - Settle event
router.post('/:eventId/settle', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { winner, admin_signature } = req.body;

    if (!winner || !admin_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing winner or signature' 
      });
    }

    const result = await pool.query(
      'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['settled', eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    // TODO: Call Results Settlement Program when deployed
    // const programId = process.env.RESULTS_SETTLEMENT_PROGRAM_ID;
    // const settleTx = await solanaClient.settleEventOnChain(eventId, winner);

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

module.exports = router;
